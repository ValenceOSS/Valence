import { describe, expect, it } from 'vitest';
import { originElsewhere } from './originElsewhere';

const HERE = 'https://valence.example';

describe('originElsewhere', () => {
  it('names the server an address is on, where it is another', () => {
    expect(originElsewhere('https://films.example/api/federation/v1/direct/t/file', HERE)).toBe(
      'https://films.example',
    );
  });

  it('says nothing for an address on this page’s own server', () => {
    expect(originElsewhere('/api/playback/session/s/index.m3u8', HERE)).toBeNull();
    expect(originElsewhere('https://valence.example/api/playback/m/file', HERE)).toBeNull();
  });

  it('says nothing for an address it cannot read', () => {
    expect(originElsewhere('http://[nonsense', HERE)).toBeNull();
  });
});
