import { describe, expect, it } from 'vitest';
import { decodeUrlText } from './decodeUrlText';

describe('decodeUrlText', () => {
  it('decodes escapes and pluses', () => {
    expect(decodeUrlText('preacher+s01e10%21', 'UTF-8')).toBe('preacher s01e10!');
  });

  it('reads escaped bytes in the site’s own character set', () => {
    expect(decodeUrlText('%CC%E8%F0', 'windows-1251')).toBe('Мир');
  });

  it('falls back to UTF-8, and leaves a broken escape as text', () => {
    expect(decodeUrlText('%C3%A9%zz', 'klingon')).toBe('é%zz');
  });
});
