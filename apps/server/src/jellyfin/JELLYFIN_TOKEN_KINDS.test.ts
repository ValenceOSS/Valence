import { describe, expect, it } from 'vitest';
import { JELLYFIN_TOKEN_KINDS } from './JELLYFIN_TOKEN_KINDS';

describe('JELLYFIN_TOKEN_KINDS', () => {
  it('marks sessions and keys apart', () => {
    expect(JELLYFIN_TOKEN_KINDS.session).not.toBe(JELLYFIN_TOKEN_KINDS.key);
  });
});
