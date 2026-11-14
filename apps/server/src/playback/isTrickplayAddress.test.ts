import { describe, expect, it } from 'vitest';
import { isTrickplayAddress } from './isTrickplayAddress';

describe('isTrickplayAddress', () => {
  it('takes the address the transcoder names thumbnails by', () => {
    expect(isTrickplayAddress('0123456789abcdef0123456789abcdef')).toBe(true);
  });

  it('refuses anything that could reach outside the thumbnails', () => {
    for (const id of [
      '../../../../proc/1',
      '..',
      '',
      '0123456789abcdef0123456789abcde/',
      '0123456789ABCDEF0123456789ABCDEF',
      '0123456789abcdef0123456789abcdef0',
    ]) {
      expect(isTrickplayAddress(id)).toBe(false);
    }
  });
});
