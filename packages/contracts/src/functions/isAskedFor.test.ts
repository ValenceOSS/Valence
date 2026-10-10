import { describe, expect, it } from 'vitest';
import { isAskedFor } from './isAskedFor';

describe('isAskedFor', () => {
  it('holds for a title somebody asked for, and not for one only followed', () => {
    expect(isAskedFor({ origin: 'asked' })).toBe(true);
    expect(isAskedFor({ origin: 'monitored' })).toBe(false);
  });
});
