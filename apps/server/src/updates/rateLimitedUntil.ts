/**
 * Reads when GitHub will answer again from an answer refusing for having been asked too often, by
 * its `retry-after` or its `x-ratelimit-reset` once the allowance is spent.
 *
 * @param answer - What GitHub answered.
 * @param now - The time now, in milliseconds.
 * @returns When to ask again, in milliseconds, or null where the answer was no such refusal.
 */
const rateLimitedUntil = (answer: Response, now: number): number | null => {
  if (answer.status !== 403 && answer.status !== 429) {
    return null;
  }

  const retryAfter = Number(answer.headers.get('retry-after'));

  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return now + retryAfter * 1000;
  }

  const reset = Number(answer.headers.get('x-ratelimit-reset'));

  return answer.headers.get('x-ratelimit-remaining') === '0' && Number.isFinite(reset) && reset > 0
    ? reset * 1000
    : null;
};

export { rateLimitedUntil };
