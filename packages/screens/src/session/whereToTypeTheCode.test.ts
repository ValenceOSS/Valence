import { describe, expect, it } from 'vitest';
import { whereToTypeTheCode } from './whereToTypeTheCode';

describe('what a television puts on screen', () => {
  it('drops the scheme, which nobody types', () => {
    expect(whereToTypeTheCode('https://valence.example/device')).toBe('valence.example/device');
  });

  it('drops an insecure scheme too, since a home server often has none', () => {
    expect(whereToTypeTheCode('http://valence.local:8420/device')).toBe(
      'valence.local:8420/device',
    );
  });

  it('drops a trailing slash rather than leaving it hanging', () => {
    expect(whereToTypeTheCode('https://valence.example/device/')).toBe('valence.example/device');
  });

  it('leaves an address that is already short alone', () => {
    expect(whereToTypeTheCode('valence.local/device')).toBe('valence.local/device');
  });
});
