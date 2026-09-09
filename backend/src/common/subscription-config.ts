/** When false (default), all users receive pro-tier access regardless of stored subscription. */
export function isSubscriptionSwitchEnabled(): boolean {
  const raw = process.env.SUBSCRIPTION_SWITCH ?? process.env.subscription_switch ?? 'false';
  return raw === 'true' || raw === 'True' || raw === '1';
}

export function resolveEffectiveTier(actualTier: string | undefined | null): 'free' | 'pro' {
  if (!isSubscriptionSwitchEnabled()) return 'pro';
  return actualTier === 'pro' ? 'pro' : 'free';
}

export function isProUser(actualTier: string | undefined | null): boolean {
  return resolveEffectiveTier(actualTier) === 'pro';
}
