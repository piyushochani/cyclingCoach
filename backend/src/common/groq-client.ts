import { Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { GroqConfig, loadGroqConfig } from './llm-config';

export function groqKeyHash(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}

function parseRetryAfterMs(response: Response, body: string): number {
  const header = response.headers.get('retry-after');
  if (header) {
    const sec = parseFloat(header);
    if (!Number.isNaN(sec)) return Math.min(Math.ceil(sec * 1000), 60_000);
  }

  const match = body.match(/try again in ([\d.]+)\s*s/i);
  if (match) return Math.min(Math.ceil(parseFloat(match[1]) * 1000), 60_000);

  return 0;
}

function modelsToTry(config: GroqConfig, preferred?: string): string[] {
  const primary = preferred || config.model;
  const chain = [primary, ...config.fallbackModels.filter((m) => m !== primary)];
  return [...new Set(chain)];
}

export async function groqChatCompletion(
  logger: Logger,
  body: Record<string, any>,
  opts?: { preferredModel?: string; skipKeyHashes?: string[] },
): Promise<any | null> {
  const config = loadGroqConfig();
  if (!config) return null;

  const models = modelsToTry(config, opts?.preferredModel);
  const skipSet = new Set(opts?.skipKeyHashes || []);

  for (const model of models) {
    const requestBody = { ...body, model };

    for (let keyIdx = 0; keyIdx < config.apiKeys.length; keyIdx++) {
      const apiKey = config.apiKeys[keyIdx];

      if (skipSet.has(groqKeyHash(apiKey))) {
        logger.warn(`Skipping Groq key ${keyIdx + 1}/${config.apiKeys.length} — marked unhealthy`);
        continue;
      }

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (response.status === 429 || response.status === 413) {
            const errText = await response.text().catch(() => '');
            const wait = parseRetryAfterMs(response, errText) || Math.min(30_000, 3000 * 2 ** attempt);
            logger.warn(
              `Groq rate limited (${response.status}) model=${model} key=${keyIdx + 1}/${config.apiKeys.length}, waiting ${wait}ms (attempt ${attempt + 1}/5)`,
            );
            await new Promise((r) => setTimeout(r, wait));
            continue;
          }

          if (!response.ok) {
            const errText = await response.text().catch(() => '');
            logger.error(`Groq API error (${model}): ${response.status} ${errText.slice(0, 200)}`);
            break;
          }

          return await response.json();
        } catch (err) {
          if (attempt === 4) {
            logger.error(`Groq call failed (${model}, key ${keyIdx + 1}): ${err}`);
            break;
          }
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        }
      }
    }
  }

  return null;
}

export async function callGroqChat(
  logger: Logger,
  messages: Array<{ role: string; content?: string | null; tool_calls?: any[]; tool_call_id?: string }>,
  opts?: { tools?: any[]; temperature?: number; maxTokens?: number; model?: string; skipKeyHashes?: string[] },
): Promise<{ content?: string; tool_calls?: any[] } | null> {
  const body: Record<string, any> = {
    messages,
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? 2048,
  };
  if (opts?.tools?.length) body.tools = opts.tools;

  const data = await groqChatCompletion(logger, body, {
    preferredModel: opts?.model,
    skipKeyHashes: opts?.skipKeyHashes,
  });
  const choice = data?.choices?.[0];
  if (!choice?.message) return null;
  return choice.message;
}

export async function callGroqSimple(
  logger: Logger,
  prompt: string,
  opts?: { temperature?: number; maxTokens?: number; model?: string; skipKeyHashes?: string[] },
): Promise<string | null> {
  const message = await callGroqChat(
    logger,
    [{ role: 'user', content: prompt }],
    {
      temperature: opts?.temperature ?? 0.3,
      maxTokens: opts?.maxTokens ?? 512,
      model: opts?.model,
      skipKeyHashes: opts?.skipKeyHashes,
    },
  );
  return message?.content || null;
}
