import { describe, expect, it } from 'vitest';
import { isCurlPull } from './isCurlPull';

describe('isCurlPull', () => {
  it('waits until the pointer has moved a little way', () => {
    expect(isCurlPull(8, 8)).toBe(false);
    expect(isCurlPull(10, 10)).toBe(true);
  });

  it('lets a corner be pulled diagonally', () => {
    expect(isCurlPull(20, 30)).toBe(true);
  });

  it('is not a hand moving straight up or down', () => {
    expect(isCurlPull(5, 40)).toBe(false);
  });
});
