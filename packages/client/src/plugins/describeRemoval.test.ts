import { describe, expect, it } from 'vitest';
import { describeRemoval } from './describeRemoval';

const NOTHING = {
  bytesKept: 0,
  people: 0,
  accounts: [],
  themes: 0,
  nodes: 0,
  webhooks: 0,
  keepsEarlierVersion: false,
};

describe('describeRemoval', () => {
  it('says nothing about what a plugin never had', () => {
    expect(describeRemoval(NOTHING)).toEqual([]);
  });

  it('lists what goes, saying which providers are asked to cancel access', () => {
    expect(
      describeRemoval({
        bytesKept: 2048,
        people: 3,
        accounts: [
          { provider: 'AniList', connected: 3, isRevoked: false },
          { provider: 'Spotify', connected: 1, isRevoked: true },
        ],
        themes: 1,
        nodes: 2,
        webhooks: 1,
        keepsEarlierVersion: true,
      }),
    ).toEqual([
      '2.0 KB of plugin data is deleted.',
      '3 accounts connected to AniList are disconnected.',
      '1 account connected to Spotify is disconnected, and Spotify is asked to revoke access.',
      'Roles lose the 2 permissions it added, and reinstalling doesn’t restore them.',
      'Its webhook URL stops working. Reinstalling it creates a new one.',
      'Anyone using its theme is switched back to Valence’s default colours.',
      'The previous version saved for rollback is also deleted.',
    ]);
  });

  it('names the people who used it when nobody connected an account', () => {
    expect(describeRemoval({ ...NOTHING, people: 1 })).toEqual([
      '1 person loses the data they saved in it.',
    ]);
  });
});
