import { describe, expect, it } from 'vitest';
import { aClientData } from './aClientData';

describe('aClientData', () => {
  it('says the server’s own origin, as a page on the server would', () => {
    expect(
      JSON.parse(aClientData('webauthn.get', 'Y2hhbGxlbmdl', 'https://valence.example/some/path')),
    ).toEqual({
      type: 'webauthn.get',
      challenge: 'Y2hhbGxlbmdl',
      origin: 'https://valence.example',
      crossOrigin: false,
    });
  });

  it('keeps a port the server is reached on', () => {
    expect(
      JSON.parse(aClientData('webauthn.create', 'abc', 'https://valence.example:8443')),
    ).toMatchObject({
      type: 'webauthn.create',
      origin: 'https://valence.example:8443',
    });
  });
});
