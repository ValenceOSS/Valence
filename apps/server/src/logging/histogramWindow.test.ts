import { describe, expect, it } from 'vitest';
import { histogramWindow } from './histogramWindow';

const NOW = 10_000_000;

describe('histogramWindow', () => {
  it('covers exactly what was asked for, split into no more bars than are wanted', () => {
    const window = histogramWindow({ sinceMs: 1_000_000, untilMs: 4_000_000 }, null, NOW, 30);

    expect(window.untilMs).toBe(4_000_000);
    expect(window.bucketMs).toBe(100_000);
    expect(window.fromMs).toBe(1_000_000);
    expect((window.untilMs - window.fromMs) / window.bucketMs).toBeLessThanOrEqual(30);
  });

  it('runs up to now where no end was given', () => {
    expect(histogramWindow({ sinceMs: 9_000_000, untilMs: null }, null, NOW, 10).untilMs).toBe(NOW);
  });

  it('starts at the earliest record where no start was given', () => {
    const window = histogramWindow({ sinceMs: null, untilMs: null }, 5_000_000, NOW, 50);

    expect(window.fromMs).toBeLessThanOrEqual(5_000_000);
    expect(window.fromMs).toBeGreaterThan(5_000_000 - window.bucketMs);
  });

  it('falls back to the last hour where there is nothing to start from', () => {
    const window = histogramWindow({ sinceMs: null, untilMs: null }, null, NOW, 60);

    expect(window.untilMs - window.fromMs).toBeGreaterThanOrEqual(3_600_000);
    expect(window.bucketMs).toBe(60_000);
  });

  it('never makes a bar narrower than a second', () => {
    expect(histogramWindow({ sinceMs: NOW - 5, untilMs: NOW }, null, NOW, 200).bucketMs).toBe(1000);
  });

  it('begins the first bar on a multiple of the bar width, so bars keep their places', () => {
    const window = histogramWindow({ sinceMs: 1_234_567, untilMs: 5_000_000 }, null, NOW, 20);

    expect(window.fromMs % window.bucketMs).toBe(0);
  });
});
