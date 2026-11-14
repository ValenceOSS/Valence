import { describe, expect, it, vi } from 'vitest';
import { createBriefVerdicts } from './createBriefVerdicts';

describe('createBriefVerdicts', () => {
  it('asks once for requests within the window, and again after it', async () => {
    let at = 0;
    const ask = vi.fn(() => Promise.resolve(true));
    const verdicts = createBriefVerdicts(5000, () => at);

    expect(await verdicts.judge('ticket', ask)).toBe(true);
    at += 4000;
    expect(await verdicts.judge('ticket', ask)).toBe(true);
    expect(ask).toHaveBeenCalledTimes(1);

    at += 2000;
    await verdicts.judge('ticket', ask);

    expect(ask).toHaveBeenCalledTimes(2);
  });

  it('keeps each key to its own answer', async () => {
    const verdicts = createBriefVerdicts(5000, () => 0);

    expect(await verdicts.judge('a', () => Promise.resolve(true))).toBe(true);
    expect(await verdicts.judge('b', () => Promise.resolve(false))).toBe(false);
  });

  it('shares one question between requests that arrive together', async () => {
    const ask = vi.fn(() => Promise.resolve(false));
    const verdicts = createBriefVerdicts(5000, () => 0);

    await Promise.all([verdicts.judge('a', ask), verdicts.judge('a', ask)]);

    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('does not remember a question that failed', async () => {
    const ask = vi.fn<() => Promise<boolean>>().mockRejectedValueOnce(new Error('busy'));
    const verdicts = createBriefVerdicts(5000, () => 0);

    await expect(verdicts.judge('a', ask)).rejects.toThrow('busy');
    await Promise.resolve();
    ask.mockResolvedValue(true);

    expect(await verdicts.judge('a', ask)).toBe(true);
  });
});
