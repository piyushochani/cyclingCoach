import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stringify as toYaml } from "yaml";

const MANAGED_ENV = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "LLM_PROVIDER",
  "LLM_MODEL",
  "CONTEXT_WINDOW_TOKENS",
];

let tempHome: string;
let origCcHome: string | undefined;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  tempHome = mkdtempSync(join(tmpdir(), "cc-secretref-"));
  origCcHome = process.env.CYCLING_COACH_HOME;
  process.env.CYCLING_COACH_HOME = tempHome;
  mkdirSync(tempHome, { recursive: true });
  for (const k of MANAGED_ENV) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  vi.resetModules();
});

afterEach(() => {
  if (origCcHome !== undefined) process.env.CYCLING_COACH_HOME = origCcHome;
  else delete process.env.CYCLING_COACH_HOME;
  for (const k of MANAGED_ENV) {
    if (savedEnv[k] !== undefined) process.env[k] = savedEnv[k];
    else delete process.env[k];
  }
  rmSync(tempHome, { recursive: true, force: true });
  vi.restoreAllMocks();
});

const CONFIG = () => join(tempHome, "config.yaml");

function seed(obj: Record<string, unknown>): void {
  writeFileSync(CONFIG(), toYaml(obj), { mode: 0o600 });
}

describe("config — SecretRef integration", () => {
  it("plain-string YAML resolves unchanged (backward compat)", async () => {
    seed({
      llm: { provider: "anthropic", api_key: "sk-plain", model: "claude-sonnet-4-6" },
      telegram: { bot_token: "tg-plain" },
    });
    const { loadConfig, resolveConfigSecrets } = await import("../src/config.js");
    const cfg = await resolveConfigSecrets(loadConfig());
    expect(cfg.llm.apiKey).toBe("sk-plain");
    expect(cfg.telegram.botToken).toBe("tg-plain");
  });

  it("SecretRef YAML + printf sk-test resolves to 'sk-test'", async () => {
    const isWin = process.platform === "win32";
    const cmd = isWin ? "cmd" : "printf";
    const args = isWin ? ["/c", "echo", "sk-test"] : ["sk-test"];
    seed({
      llm: {
        provider: "anthropic",
        api_key: { source: "exec", command: cmd, args },
        model: "claude-sonnet-4-6",
      },
    });
    const { loadConfig, resolveConfigSecrets } = await import("../src/config.js");
    const cfg = await resolveConfigSecrets(loadConfig());
    expect(cfg.llm.apiKey).toBe("sk-test");
  });

  it("env var wins over SecretRef — spawn is never invoked", async () => {
    seed({
      llm: {
        provider: "anthropic",
        api_key: { source: "exec", command: "/definitely/not/real/cmd" },
        model: "claude-sonnet-4-6",
      },
    });
    process.env.ANTHROPIC_API_KEY = "env-wins";
    const { loadConfig, resolveConfigSecrets } = await import("../src/config.js");
    const cfg = await resolveConfigSecrets(loadConfig());
    expect(cfg.llm.apiKey).toBe("env-wins");
  });

  it("malformed SecretRef throws INVALID_REF at loadConfig (eager validation)", async () => {
    seed({
      llm: {
        provider: "anthropic",
        api_key: { source: "exec" },
        model: "claude-sonnet-4-6",
      },
    });
    const { loadConfig } = await import("../src/config.js");
    const { SecretResolutionError } = await import("../src/secrets/types.js");
    let caught: unknown;
    try {
      loadConfig();
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(SecretResolutionError);
    expect((caught as { code: string }).code).toBe("INVALID_REF");
    expect((caught as Error).message).toContain("llm.api_key");
  });

  it("empty YAML preserves '' fall-through for optional telegram", async () => {
    seed({
      llm: { provider: "anthropic", api_key: "sk", model: "claude-sonnet-4-6" },
    });
    const { loadConfig, resolveConfigSecrets } = await import("../src/config.js");
    const cfg = await resolveConfigSecrets(loadConfig());
    expect(cfg.telegram.botToken).toBe("");
  });

  it("resolves SecretRefs on all three fields together", async () => {
    const isWin = process.platform === "win32";
    const cmd = isWin ? "cmd" : "printf";
    const llmArgs = isWin ? ["/c", "echo", "llm-key"] : ["llm-key"];
    const tgArgs = isWin ? ["/c", "echo", "tg-key"] : ["tg-key"];
    seed({
      llm: {
        provider: "anthropic",
        api_key: { source: "exec", command: cmd, args: llmArgs },
        model: "claude-sonnet-4-6",
      },
      telegram: {
        bot_token: { source: "exec", command: cmd, args: tgArgs },
      },
    });
    const { loadConfig, resolveConfigSecrets } = await import("../src/config.js");
    const cfg = await resolveConfigSecrets(loadConfig());
    expect(cfg.llm.apiKey).toBe("llm-key");
    expect(cfg.telegram.botToken).toBe("tg-key");
  });

  it("env-source SecretRef resolves from process.env", async () => {
    process.env.MY_LLM_KEY = "llm-from-env";
    process.env.MY_TG_KEY = "tg-from-env";
    try {
      seed({
        llm: {
          provider: "anthropic",
          api_key: { source: "env", var: "MY_LLM_KEY" },
          model: "claude-sonnet-4-6",
        },
        telegram: {
          bot_token: { source: "env", var: "MY_TG_KEY" },
        },
      });
      const { loadConfig, resolveConfigSecrets } = await import("../src/config.js");
      const cfg = await resolveConfigSecrets(loadConfig());
      expect(cfg.llm.apiKey).toBe("llm-from-env");
      expect(cfg.telegram.botToken).toBe("tg-from-env");
    } finally {
      delete process.env.MY_LLM_KEY;
      delete process.env.MY_TG_KEY;
    }
  });

  it("env-source SecretRef throws ENOENT when var is unset", async () => {
    seed({
      llm: {
        provider: "anthropic",
        api_key: { source: "env", var: "DEFINITELY_UNSET_XYZ_123" },
        model: "claude-sonnet-4-6",
      },
    });
    const { loadConfig, resolveConfigSecrets } = await import("../src/config.js");
    const { SecretResolutionError } = await import("../src/secrets/types.js");
    const err = await resolveConfigSecrets(loadConfig()).catch(
      (e) => e as SecretResolutionError,
    );
    expect(err).toBeInstanceOf(SecretResolutionError);
    expect(err.code).toBe("ENOENT");
    expect(err.message).toContain("DEFINITELY_UNSET_XYZ_123");
  });
});
