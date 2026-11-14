import { describe, expect, it } from 'vitest';
import { JELLYFIN_ITEM_DEFAULTS } from './JELLYFIN_ITEM_DEFAULTS';

describe('JELLYFIN_ITEM_DEFAULTS', () => {
  it('lets every item be played in full and carry the empty lists Jellyfin always sends', () => {
    expect(JELLYFIN_ITEM_DEFAULTS).toMatchObject({ PlayAccess: 'Full', Tags: [], Studios: [] });
  });
});
