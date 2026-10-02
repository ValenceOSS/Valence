import { describe, expect, it } from 'vitest';
import { noCounts } from './noCounts';

describe('noCounts', () => {
  it('counts nothing yet, a fresh object each time', () => {
    expect(Object.values(noCounts()).every((count) => count === 0)).toBe(true);
    expect(noCounts()).not.toBe(noCounts());
  });
});
