import { describe, expect, it } from 'vitest';
import { writeLinkInvite } from './writeLinkInvite';
import { readLinkInvite } from './readLinkInvite';

const CONTENTS = {
  v: 1,
  address: 'https://anime.example',
  code: 'a-code-long-enough-to-count',
  fingerprint: 'abcd',
} as const;

describe('writeLinkInvite', () => {
  it('writes an invite that reads back as what it carries', () => {
    const invite = writeLinkInvite(CONTENTS);

    expect(invite.startsWith('valence-link:')).toBe(true);
    expect(readLinkInvite(invite)).toEqual(CONTENTS);
  });
});
