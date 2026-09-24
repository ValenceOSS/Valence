import { describe, expect, it } from 'vitest';
import { stillListening } from '@ValenceClient/books/stillListening';
import { aListening } from '@ValenceClient/testing/aListening';

describe('stillListening', () => {
  it('keeps the books somebody has not finished, saying how far through each they are', () => {
    const kept = stillListening([aListening(), aListening({ isFinished: true })]);

    expect(kept).toHaveLength(1);
    expect(kept[0]?.fraction).toBeCloseTo(0.55);
    expect(kept[0]?.detail).toBe('Part 2 · 9 min left');
  });

  it('says a book with no length is not started, rather than dividing by nothing', () => {
    expect(stillListening([aListening({ durationSeconds: 0 })])[0]?.fraction).toBe(0);
  });
});
