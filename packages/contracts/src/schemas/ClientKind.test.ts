import { describe, expect, it } from 'vitest';
import { CLIENT_KINDS, ClientKindSchema } from './ClientKind';

describe('ClientKindSchema', () => {
  it('reads every kind of device Valence runs on', () => {
    for (const kind of CLIENT_KINDS) {
      expect(ClientKindSchema.parse(kind)).toBe(kind);
    }
  });

  it('knows a television', () => {
    expect(CLIENT_KINDS).toContain('tv');
  });

  it('refuses a kind of device it does not know', () => {
    expect(ClientKindSchema.safeParse('watch').success).toBe(false);
  });
});
