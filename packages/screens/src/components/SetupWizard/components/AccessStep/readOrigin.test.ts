import { describe, expect, it } from 'vitest';
import { readOrigin } from './readOrigin';

describe('readOrigin', () => {
  it('reads an address down to its origin', () => {
    expect(readOrigin('https://valence.example.com/library?x=1')).toBe(
      'https://valence.example.com',
    );
  });

  it('keeps a port and ignores the spaces around what was typed', () => {
    expect(readOrigin('  http://192.168.1.40:8420/  ')).toBe('http://192.168.1.40:8420');
  });

  it('refuses something that is not an address at all', () => {
    expect(readOrigin('valence.example.com')).toBeNull();
    expect(readOrigin('')).toBeNull();
  });

  it('refuses an address that is not on the web', () => {
    expect(readOrigin('ftp://valence.example.com')).toBeNull();
  });
});
