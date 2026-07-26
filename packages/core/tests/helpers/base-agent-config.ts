/**
 * Minimal config for constructing CoachAgent in tests. Uses the
 * openai-codex provider with empty apiKey so no real LLM is reachable.
 */
export function baseAgentConfig(dataDir: string) {
  return {
    llm: {
      provider: "openai-codex" as const,
      model: "gpt-5.4",
      apiKey: "",
      authProfile: "openai-codex",
    },
    strava: {
      clientId: "",
      clientSecret: "",
      accessToken: undefined,
      refreshToken: undefined,
      expiresAt: undefined,
    },
    pinecone: {
      apiKey: "",
      indexName: "",
      host: "",
      namespace: undefined,
    },
    telegram: { botToken: "" },
    session: {
      historyTokenBudgetRatio: 0.3,
      idleMinutes: 0,
      dailyResetHour: 4,
      timezone: "",
    },
    contextWindowTokens: 272_000,
    dataDir,
  };
}
