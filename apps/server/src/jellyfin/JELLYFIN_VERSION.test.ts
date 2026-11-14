import { describe, expect, it } from 'vitest';
import { JELLYFIN_VERSION } from './JELLYFIN_VERSION';

describe('JELLYFIN_VERSION', () => {
  it('answers as Jellyfin 10.10', () => {
    expect(JELLYFIN_VERSION.startsWith('10.10.')).toBe(true);
  });
});
