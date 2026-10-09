import { describe, expect, it } from 'vitest';
import { isAskedBy } from './isAskedBy';

const REQUEST = {
  requestedBy: { id: 'a', name: 'Priya' },
  alsoAskedBy: [{ id: 'b', name: 'Sam' }],
};

describe('isAskedBy', () => {
  it('holds for the first asker and for one who joined', () => {
    expect(isAskedBy(REQUEST, 'a')).toBe(true);
    expect(isAskedBy(REQUEST, 'b')).toBe(true);
  });

  it('holds for nobody else, nor for nobody', () => {
    expect(isAskedBy(REQUEST, 'c')).toBe(false);
    expect(isAskedBy(REQUEST, null)).toBe(false);
    expect(isAskedBy(REQUEST, undefined)).toBe(false);
  });
});
