import { describe, expect, it } from 'vitest';
import { plainTextOf } from './plainTextOf';

describe('plainTextOf', () => {
  it('spells out entities, drops tags and keeps paragraphs apart', () => {
    expect(plainTextOf('<p>Tom &amp; Jerry&#39;s &#x41;</p><p>Two</p>')).toBe(
      "Tom & Jerry's A\nTwo",
    );
  });

  it('spells out an entity however many times it was escaped', () => {
    expect(plainTextOf('&amp;amp;lt;')).toBe('<');
  });

  it('leaves a numeric entity that is no character as it was written', () => {
    expect(plainTextOf('a &#x110000; b')).toBe('a &#x110000; b');
    expect(plainTextOf('a &#99999999; b')).toBe('a &#99999999; b');
    expect(plainTextOf(`a &#${'9'.repeat(400)}; b`)).toBe(`a &#${'9'.repeat(400)}; b`);
    expect(plainTextOf('a &#xD800; b')).toBe('a &#xD800; b');
  });

  it('turns a zero character into the replacement character', () => {
    expect(plainTextOf('a&#0;b')).toBe('a�b');
  });
});
