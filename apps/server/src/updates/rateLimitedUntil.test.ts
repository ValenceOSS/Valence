import { describe, expect, it } from 'vitest';
import { rateLimitedUntil } from './rateLimitedUntil';

const NOW = 1_800_000_000_000;

describe('rateLimitedUntil', () => {
  it('waits for the reset once the allowance is spent', () => {
    const answer = new Response('', {
      status: 403,
      headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800003600' },
    });

    expect(rateLimitedUntil(answer, NOW)).toBe(1_800_003_600_000);
  });

  it('waits as long as GitHub asks, where it says how long', () => {
    const answer = new Response('', { status: 429, headers: { 'retry-after': '60' } });

    expect(rateLimitedUntil(answer, NOW)).toBe(NOW + 60_000);
  });

  it('waits until the date GitHub gives, where it gives one rather than seconds', () => {
    const answer = new Response('', {
      status: 429,
      headers: { 'retry-after': new Date(NOW + 90_000).toUTCString() },
    });

    expect(rateLimitedUntil(answer, NOW)).toBe(NOW + 90_000);
  });

  it('does not wait over a refusal that is not about being asked too often', () => {
    expect(rateLimitedUntil(new Response('', { status: 403 }), NOW)).toBeNull();
    expect(rateLimitedUntil(new Response('', { status: 200 }), NOW)).toBeNull();
  });
});
