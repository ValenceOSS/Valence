import { describe, expect, it } from 'vitest';
import { clipToFold } from './clipToFold';

describe('clipToFold', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  const fold = { at: { x: 80, y: 0 }, normal: { x: -1, y: 0 } };

  it('keeps the part that stays flat', () => {
    expect(clipToFold(square, fold, 'rest')).toEqual([
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 100 },
      { x: 0, y: 100 },
    ]);
  });

  it('keeps the flap on the corner’s side', () => {
    expect(clipToFold(square, fold, 'flap')).toEqual([
      { x: 80, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 80, y: 100 },
    ]);
  });

  it('keeps nothing of a shape lying wholly on the other side', () => {
    expect(clipToFold(square, { at: { x: 200, y: 0 }, normal: { x: -1, y: 0 } }, 'flap')).toEqual(
      [],
    );
  });
});
