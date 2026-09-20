import { describe, expect, it } from 'vitest';
import { readSize } from './readSize';

describe('readSize', () => {
  it.each([
    ['8000000000', 8_000_000_000],
    ['512 B', 512],
    ['1 KB', 1024],
    ['700 MiB', 700 * 1024 ** 2],
    ['1.4 GB', Math.round(1.4 * 1024 ** 3)],
    ['1,2 Go', Math.round(1.2 * 1024 ** 3)],
    ['2 TB', 2 * 1024 ** 4],
  ])('reads %s as %d bytes', (text, bytes) => {
    expect(readSize(text)).toBe(bytes);
  });

  it('reads nothing where there is no size', () => {
    expect(readSize('unknown')).toBeNull();
  });
});
