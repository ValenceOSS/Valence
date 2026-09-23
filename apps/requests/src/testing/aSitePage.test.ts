import { describe, expect, it } from 'vitest';
import { anAnswer } from '@ValenceRequests/testing/anAnswer';
import { aSitePage } from './aSitePage';

describe('aSitePage', () => {
  it('plays its script, then carries on as an ordinary site', async () => {
    const page = aSitePage({
      standings: ['challenged'],
      clicks: [true],
      answers: [anAnswer({ status: 403 })],
      visits: ['download'],
    });

    expect(page.origin()).toBe('null');
    expect(await page.visit('https://example.org/a')).toBe('download');
    expect(page.origin()).toBe('https://example.org');
    expect(await page.visit('https://example.org/b')).toBe('visited');
    expect([await page.standing(), await page.standing()]).toEqual(['challenged', 'clear']);
    expect([await page.clickTurnstile(), await page.clickTurnstile()]).toEqual([true, false]);
    expect((await page.fetch()).status).toBe(403);
    expect((await page.fetch()).status).toBe(200);
    expect(await page.userAgent()).toContain('Firefox');
    await expect(page.close()).resolves.toBeUndefined();
  });
});
