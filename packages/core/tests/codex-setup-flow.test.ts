import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

import { scriptedPrompts } from "./helpers/scripted-prompts.js";
import { cyclingBinary } from "./helpers/cycling-binary-fixture.js";

let tempHome: string;
let origCcHome: string | undefined;
let origStdinTTY: boolean | undefined;
let origStdoutTTY: boolean | undefined;

beforeEach(() => {
  tempHome = mkdtempSync(join(tmpdir(), "cc-setup-"));
  origCcHome = process.env.CYCLING_COACH_HOME;
  process.env.CYCLING_COACH_HOME = tempHome;
  origStdinTTY = process.stdin.isTTY;
  origStdoutTTY = process.stdout.isTTY;
  Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
  Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
  vi.resetModules();
  vi.doMock("../src/secrets/backends/detect.js", () => ({
    detectBackends: vi.fn(async () => ({
      op: { state: "unavailable", reason: "not-on-path" },
      keychain: { available: false },
    })),
  }));
});

afterEach(() => {
  if (origCcHome !== undefined) process.env.CYCLING_COACH_HOME = origCcHome;
  else delete process.env.CYCLING_COACH_HOME;
  Object.defineProperty(process.stdin, "isTTY", { value: origStdinTTY, configurable: true });
  Object.defineProperty(process.stdout, "isTTY", { value: origStdoutTTY, configurable: true });
  rmSync(tempHome, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("codex setup flow", () => {
  it("writes config without api_key and saves auth-profiles.json with 0o600", async () => {
    vi.doMock("@clack/prompts", () =>
      scriptedPrompts({
        selects: ["openai-codex", "gpt-5.4", "plain"], // provider, model, backend
        texts: ["strava-client-id-val", "pinecone-index-val"], // Strava Client ID, Pinecone Index Name
        passwords: ["strava-secret-val", "pinecone-key-val", "tg-token-val"], // Strava Client Secret, Pinecone API Key, Telegram bot token
      }),
    );

    vi.doMock("../src/auth/openai-codex-login.js", () => ({
      runCodexLogin: vi.fn(async () => ({
        type: "oauth",
        access: "fake-access",
        refresh: "fake-refresh",
        expires: Date.now() + 3_600_000,
        accountId: "acct",
      })),
    }));

    const { runSetup } = await import("../src/setup.js");
    await runSetup(cyclingBinary);

    const configPath = join(tempHome, "config.yaml");
    expect(existsSync(configPath)).toBe(true);
    const yaml = parseYaml(readFileSync(configPath, "utf-8")) as Record<string, unknown>;
    const llm = yaml.llm as Record<string, unknown>;
    expect(llm.provider).toBe("openai-codex");
    expect(llm.model).toBe("gpt-5.4");
    expect(llm.api_key).toBeUndefined();
    expect(llm.auth_profile).toBe("openai-codex");

    const strava = yaml.strava as Record<string, unknown>;
    expect(strava.client_id).toBe("strava-client-id-val");
    expect(strava.client_secret).toBe("strava-secret-val");

    const pinecone = yaml.pinecone as Record<string, unknown>;
    expect(pinecone.api_key).toBe("pinecone-key-val");
    expect(pinecone.index_name).toBe("pinecone-index-val");

    const telegram = yaml.telegram as Record<string, unknown>;
    expect(telegram.bot_token).toBe("tg-token-val");

    const profilesPath = join(tempHome, "auth-profiles.json");
    expect(existsSync(profilesPath)).toBe(true);
    if (process.platform !== "win32") {
      const st = statSync(profilesPath);
      expect(st.mode & 0o777).toBe(0o600);
    }

    const saved = JSON.parse(readFileSync(profilesPath, "utf-8"));
    expect(saved["openai-codex"].access).toBe("fake-access");
    expect(saved["openai-codex"].refresh).toBe("fake-refresh");
  });
});
