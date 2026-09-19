import { describe, expect, it } from 'vitest';
import { isJsonList } from './isJsonList';

describe('isJsonList', () => {
  it('knows a list', () => {
    expect(isJsonList([1, 2])).toBe(true);
    expect(isJsonList({ a: 1 })).toBe(false);
    expect(isJsonList(undefined)).toBe(false);
  });
});
