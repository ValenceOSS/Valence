import { describe, expect, it } from 'vitest';
import { binHistogram } from './binHistogram';

const WINDOW = { fromMs: 1000, untilMs: 5000, bucketMs: 1000 };

describe('binHistogram', () => {
  it('makes a bar for every stretch of time, empty ones included', () => {
    const bars = binHistogram([], WINDOW);

    expect(bars.map((bar) => bar.atMs)).toEqual([1000, 2000, 3000, 4000]);
    expect(bars.every((bar) => bar.error === 0 && bar.info === 0)).toBe(true);
  });

  it('puts each count in the bar and the level it belongs to', () => {
    const bars = binHistogram(
      [
        { bucket: 1, level: 'error', events: 3 },
        { bucket: 1, level: 'info', events: 10 },
        { bucket: 3, level: 'warn', events: 2 },
      ],
      WINDOW,
    );

    expect(bars[0]).toMatchObject({ error: 3, info: 10, warn: 0 });
    expect(bars[2]).toMatchObject({ warn: 2 });
  });

  it('adds up rows that fall in the same bar and level', () => {
    const bars = binHistogram(
      [
        { bucket: 2, level: 'info', events: 4 },
        { bucket: 2, level: 'info', events: 5 },
      ],
      WINDOW,
    );

    expect(bars[1]?.info).toBe(9);
  });

  it('leaves out anything before the graph, after it, or of a level it does not know', () => {
    const bars = binHistogram(
      [
        { bucket: 0, level: 'error', events: 1 },
        { bucket: 9, level: 'error', events: 1 },
        { bucket: 2, level: 'fatal', events: 1 },
      ],
      WINDOW,
    );

    expect(bars.every((bar) => bar.debug + bar.info + bar.warn + bar.error === 0)).toBe(true);
  });

  it('draws at least one bar however short the range', () => {
    expect(binHistogram([], { fromMs: 1000, untilMs: 1000, bucketMs: 1000 })).toHaveLength(1);
  });
});
