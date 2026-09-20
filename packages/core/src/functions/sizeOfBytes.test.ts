import { describe, expect, it } from 'vitest';
import { sizeOfBytes } from './sizeOfBytes';

describe('sizeOfBytes', () => {
  it('says bytes as bytes, with no decimals', () => {
    expect(sizeOfBytes(512)).toEqual({ value: 512, unit: 'B', decimals: 0 });
  });

  it('keeps one decimal place below ten so 1.4 GB does not read as 1 GB', () => {
    expect(sizeOfBytes(1.4 * 1024 ** 3)).toEqual({ value: 1.4, unit: 'GB', decimals: 1 });
  });

  it('drops the decimal once the number is large enough not to need it', () => {
    expect(sizeOfBytes(42 * 1024 ** 2)).toEqual({ value: 42, unit: 'MB', decimals: 0 });
  });

  it('stops at terabytes rather than inventing a unit', () => {
    expect(sizeOfBytes(5000 * 1024 ** 4)).toEqual({ value: 5000, unit: 'TB', decimals: 0 });
  });

  it('says nothing rather than nonsense for a size that is not one', () => {
    expect(sizeOfBytes(-1)).toEqual({ value: 0, unit: 'B', decimals: 0 });
    expect(sizeOfBytes(Number.NaN)).toEqual({ value: 0, unit: 'B', decimals: 0 });
  });
});
