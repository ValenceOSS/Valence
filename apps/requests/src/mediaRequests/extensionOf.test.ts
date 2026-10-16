import { describe, expect, it } from 'vitest';
import { extensionOf } from './extensionOf';

describe('extensionOf', () => {
  it('gives a file’s extension, lower case and without its dot', () => {
    expect(extensionOf('Book - Part 1.M4B')).toBe('m4b');
  });

  it('gives nothing for a file with no extension', () => {
    expect(extensionOf('README')).toBe('');
  });
});
