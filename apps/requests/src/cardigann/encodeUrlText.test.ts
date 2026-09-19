import { describe, expect, it } from 'vitest';
import { encodeUrlText } from './encodeUrlText';

describe('encodeUrlText', () => {
  it('encodes as a form would, keeping what needs no escaping', () => {
    expect(encodeUrlText('dune part-two (2024)!', 'UTF-8')).toBe('dune+part-two+(2024)!');
    expect(encodeUrlText('a&b=c', 'UTF-8')).toBe('a%26b%3Dc');
  });

  it('encodes in the site’s own character set', () => {
    expect(encodeUrlText('Мир', 'windows-1251')).toBe('%CC%E8%F0');
    expect(encodeUrlText('Мир', 'UTF-8')).toBe('%D0%9C%D0%B8%D1%80');
  });

  it('falls back to UTF-8 for a character set it does not know', () => {
    expect(encodeUrlText('é', 'klingon')).toBe('%C3%A9');
  });
});
