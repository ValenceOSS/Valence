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
      '2.0 KB it kept is deleted.',
      '3 accounts connected to AniList are forgotten.',
      '1 account connected to Spotify is forgotten, and Spotify is asked to cancel access.',
      'Roles lose the 2 permissions it added, and adding it again does not bring them back.',
      'Its webhook address stops working; a new install gets new ones.',
      'Anyone using its theme goes back to Valence’s own colours.',
      'The earlier version kept for rolling back goes too.',
    ]);
  });

  it('names the people who used it when nobody connected an account', () => {
    expect(describeRemoval({ ...NOTHING, people: 1 })).toEqual([
      '1 person loses what they had in it.',
    ]);
  });
});
