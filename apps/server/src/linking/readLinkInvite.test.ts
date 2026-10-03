import { describe, expect, it } from 'vitest';
import { readLinkInvite } from './readLinkInvite';

describe('readLinkInvite', () => {
  it('reads nothing from what is not an invite', () => {
    expect(readLinkInvite('https://example.com')).toBeNull();
    expect(readLinkInvite('valence-link:not-base64-json')).toBeNull();
    expect(
      readLinkInvite(`valence-link:${Buffer.from('{"v":2}').toString('base64url')}`),
    ).toBeNull();
  });

  it('forgives spaces around a pasted invite', () => {
    const invite = `valence-link:${Buffer.from(
      JSON.stringify({
        v: 1,
        address: 'https://a.example',
        code: 'x'.repeat(20),
        fingerprint: 'f',
      }),
    ).toString('base64url')}`;

    expect(readLinkInvite(`  ${invite}\n`)?.address).toBe('https://a.example');
  });
});
