import { Bot } from "grammy";
import type { BinaryConfig } from "../binary.js";
import {
  checkForUpdate,
  getCurrentVersion,
  getLastNotifiedVersion,
  setLastNotifiedVersion,
} from "../updater.js";
import { buildWhatsNewMessage } from "../release-notes.js";
import { createAuthMiddleware } from "./telegram-access.js";
import { loadAllowedSenders, loadAllowedSendersWithSource } from "./allowed-senders.js";
import { escapeHtmlText } from "./html-escape.js";

// ============================================================================
// TELEGRAM RELAY BOT
// ============================================================================

const WELCOME_MESSAGE =
  "Welcome to Cycling Coach!\n\n" +
  "I'm your AI cycling coach, powered by the CyclogenAI platform. " +
  "I can review your training, check your plans, suggest workouts, " +
  "and answer your cycling questions.\n\n" +
  "Commands:\n" +
  "/plan — Generate or review a training plan\n" +
  "/workout — Get today's workout suggestion\n" +
  "/status — Check your fitness, fatigue, and form\n" +
  "/review — Review your last session\n" +
  "/version — Show version info\n\n" +
  "Or just chat with me about your training!\n\n" +
  "Note: You need to link your Telegram account from the web dashboard first: " +
  "go to Profile > Link Telegram.";

function backendUrl(): string {
  return process.env.BACKEND_URL || "http://localhost:3001";
}

// Module-private factory: every Bot in this module is constructed here, with
// the auth middleware registered FIRST.
function createSecuredBot(opts: {
  token: string;
  binary: BinaryConfig;
  dataDir: string;
}): Bot {
  const bot = new Bot(opts.token);
  const challengeRateLimit = new Map<string, number>();
  bot.use(
    createAuthMiddleware({
      dataDir: opts.dataDir,
      binaryName: opts.binary.binaryName,
      challengeRateLimit,
      challengeMinIntervalMs: 60_000,
    }),
  );
  return bot;
}

function logSecurityStartup(dataDir: string, binaryName: string): void {
  const { state, source } = loadAllowedSendersWithSource(dataDir);
  const primary = state.primaryOperator ?? "none";
  console.error(
    `[security] Telegram allowlist: ${state.dmPolicy} mode (${state.allowFrom.length} allowed senders, primary: ${primary}). Source: ${source}.`,
  );
  if (state.dmPolicy === "pairing" && state.allowFrom.length === 0) {
    console.error(
      `[security] No allowed senders configured. DM the bot to receive your user-ID, then run \`${binaryName} add-sender <id>\` to authorize yourself.`,
    );
  }
}

async function callBackend(
  message: string,
  telegramChatId: string,
): Promise<string> {
  const url = `${backendUrl()}/agent/telegram-chat`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, telegramChatId }),
    });

    if (res.status === 429) {
      return "The AI service is currently rate-limited. Please try again in a minute.";
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Backend error (${res.status}): ${errText}`);
      return "Sorry, the coaching service is temporarily unavailable. Please try again later.";
    }

    const data: any = await res.json();
    return data?.text || "No response from coach.";
  } catch (err) {
    console.error("Failed to reach backend:", err);
    return "Could not reach the coaching service. Make sure the CyclogenAI backend is running (cd backend; npm run start) and BACKEND_URL is set correctly.";
  }
}

export function createTelegramBot(
  token: string,
  _config?: { binary: BinaryConfig; dataDir: string },
): Bot | null {
  const backendUrlVal = backendUrl();
  console.error(`[telegram] Backend URL: ${backendUrlVal}`);

  // We need binary config and dataDir from somewhere. If not provided via
  // _config, try to use environment or sensible defaults.
  if (!_config) return null;

  const { binary, dataDir } = _config;

  logSecurityStartup(dataDir, binary.binaryName);
  const bot = createSecuredBot({ token, binary, dataDir });
  const greeted = new Set<number>();

  // ── Commands ────────────────────────────────────────────────────────────

  bot.command("start", async (ctx) => {
    greeted.add(ctx.chat.id);
    await ctx.reply(WELCOME_MESSAGE);
  });

  bot.command("plan", async (ctx) => {
    await ctx.reply("Analyzing your data and building a plan...");
    const response = await callBackend("/plan", String(ctx.chat.id));
    await sendLongMessage(ctx, response);
  });

  bot.command("workout", async (ctx) => {
    await ctx.reply("Checking your form and plan...");
    const response = await callBackend("/workout", String(ctx.chat.id));
    await sendLongMessage(ctx, response);
  });

  bot.command("status", async (ctx) => {
    await ctx.reply("Fetching your fitness data...");
    const response = await callBackend("/status", String(ctx.chat.id));
    await sendLongMessage(ctx, response);
  });

  bot.command("review", async (ctx) => {
    const args = (ctx.match ?? "").trim();
    await ctx.reply(
      args ? `Reviewing your last session (${args})...` : "Reviewing your last session...",
    );
    const message = args ? `/review ${args}` : "/review";
    const response = await callBackend(message, String(ctx.chat.id));
    await sendLongMessage(ctx, response);
  });

  bot.command("version", async (ctx) => {
    const ver = getCurrentVersion(binary.binaryName);
    await ctx.reply(`${binary.displayName} v${ver} (relay to ${backendUrlVal})`);
  });

  bot.command("whatsnew", async (ctx) => {
    await ctx.reply("Fetching release notes...");
    try {
      const info = await checkForUpdate(binary.binaryName);
      if (!info) {
        await ctx.reply("Couldn't reach npm to check the latest version. Try again later.");
        return;
      }
      const message = await buildWhatsNewMessage(binary.binaryName, info);
      await sendLongMessage(ctx, message);
    } catch (err) {
      console.error("Error in /whatsnew:", err);
      await ctx.reply("Sorry, couldn't fetch release notes. Please try again.");
    }
  });

  // ── Free-form chat ──────────────────────────────────────────────────────

  bot.on("message:text", async (ctx) => {
    if (!greeted.has(ctx.chat.id)) {
      greeted.add(ctx.chat.id);
      // Send a brief welcome for first-time users
    }

    const response = await callBackend(ctx.message.text, String(ctx.chat.id));
    await sendLongMessage(ctx, response);
  });

  return bot;
}

// ============================================================================
// MARKDOWN → TELEGRAM HTML
// ============================================================================

export function markdownToTelegramHtml(md: string): string {
  const { text, tables } = extractTables(md);
  let html = text;

  html = html.replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  html = html.replace(/(?<!\w)\*([^*]+?)\*(?!\w)/g, "<i>$1</i>");
  html = html.replace(/(?<!\w)_([^_]+?)_(?!\w)/g, "<i>$1</i>");
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, "<pre>$1</pre>");
  html = html.replace(/`([^`]+?)`/g, "<code>$1</code>");
  html = html.replace(/~~(.+?)~~/g, "<s>$1</s>");
  html = html.replace(/^[-*]\s+/gm, "• ");

  html = html.replace(/&(?!amp;|lt;|gt;)/g, "&amp;");
  html = html.replace(/<(?!\/?(?:b|i|u|s|code|pre)>)/g, "&lt;");

  return html.replace(/\[\[__TBL_(\d+)__\]\]/g, (_, idx) => tables[Number(idx)] ?? "");
}

const TABLE_SEPARATOR_RE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/;

function isTableRow(line: string | undefined): boolean {
  if (!line) return false;
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|") && t.length > 1;
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((s) => s.trim());
}

function extractTables(md: string): { text: string; tables: string[] } {
  const lines = md.split("\n");
  const tables: string[] = [];
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const next = lines[i + 1];
    if (isTableRow(lines[i]) && next !== undefined && TABLE_SEPARATOR_RE.test(next)) {
      const header = parseTableRow(lines[i]);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j])) {
        rows.push(parseTableRow(lines[j]));
        j++;
      }
      out.push(`[[__TBL_${tables.length}__]]`);
      tables.push(renderTableAsPre(header, rows));
      i = j;
    } else {
      out.push(lines[i]);
      i++;
    }
  }
  return { text: out.join("\n"), tables };
}

function renderTableAsPre(header: string[], rows: string[][]): string {
  const cols = Math.max(header.length, ...rows.map((r) => r.length));
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    let w = (header[c] ?? "").length;
    for (const r of rows) w = Math.max(w, (r[c] ?? "").length);
    widths.push(w);
  }
  const fmt = (r: string[]) =>
    Array.from({ length: cols }, (_, c) => (r[c] ?? "").padEnd(widths[c])).join("  ").trimEnd();
  const text = [fmt(header), ...rows.map(fmt)].map(escapeHtmlText).join("\n");
  return `<pre>${text}</pre>`;
}

// ============================================================================
// SEND WITH CHUNKING
// ============================================================================

const TELEGRAM_MAX_LENGTH = 4096;
const PRE_OPEN = "<pre>";
const PRE_CLOSE = "</pre>";
const PRE_OVERHEAD = PRE_OPEN.length + PRE_CLOSE.length;

type RenderUnit = { kind: "line"; text: string } | { kind: "pre"; text: string };

function tokenizeHtml(html: string): RenderUnit[] {
  const units: RenderUnit[] = [];
  const lines = html.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const openIdx = line.indexOf(PRE_OPEN);
    const closeOnSame = openIdx >= 0 ? line.indexOf(PRE_CLOSE, openIdx) : -1;
    if (openIdx >= 0 && closeOnSame < 0) {
      let j = i + 1;
      while (j < lines.length && !lines[j].includes(PRE_CLOSE)) j++;
      if (j < lines.length) {
        units.push({ kind: "pre", text: lines.slice(i, j + 1).join("\n") });
        i = j + 1;
        continue;
      }
    }
    units.push({ kind: "line", text: line });
    i++;
  }
  return units;
}

function splitPreBlock(block: string, maxLen: number): string[] {
  const inner = block.replace(/^<pre>/, "").replace(/<\/pre>$/, "");
  const out: string[] = [];
  let current = "";
  for (const row of inner.split("\n")) {
    const candidate = current ? `${current}\n${row}` : row;
    if (candidate.length + PRE_OVERHEAD <= maxLen) {
      current = candidate;
      continue;
    }
    if (current) {
      out.push(`${PRE_OPEN}${current}${PRE_CLOSE}`);
      current = row;
      if (current.length + PRE_OVERHEAD <= maxLen) continue;
    }
    const sliceMax = Math.max(1, maxLen - PRE_OVERHEAD);
    for (let k = 0; k < row.length; k += sliceMax) {
      out.push(`${PRE_OPEN}${row.slice(k, k + sliceMax)}${PRE_CLOSE}`);
    }
    current = "";
  }
  if (current) out.push(`${PRE_OPEN}${current}${PRE_CLOSE}`);
  return out;
}

export function chunkHtml(html: string, maxLen: number = TELEGRAM_MAX_LENGTH): string[] {
  if (html.length <= maxLen) return [html];

  const chunks: string[] = [];
  let current = "";
  const flush = () => {
    if (current) {
      chunks.push(current);
      current = "";
    }
  };

  for (const unit of tokenizeHtml(html)) {
    const text = unit.text;
    const joinCost = current ? 1 : 0;

    if (current.length + text.length + joinCost <= maxLen) {
      current += (current ? "\n" : "") + text;
      continue;
    }

    flush();

    if (text.length <= maxLen) {
      current = text;
      continue;
    }

    if (unit.kind === "pre") {
      chunks.push(...splitPreBlock(text, maxLen));
    } else {
      for (let i = 0; i < text.length; i += maxLen) {
        chunks.push(text.slice(i, i + maxLen));
      }
    }
  }

  flush();
  return chunks;
}

async function sendLongMessage(
  ctx: { reply: (text: string, options?: Record<string, unknown>) => Promise<unknown> },
  text: string,
): Promise<void> {
  const html = markdownToTelegramHtml(text);
  for (const chunk of chunkHtml(html)) {
    await ctx.reply(chunk, { parse_mode: "HTML" });
  }
}
