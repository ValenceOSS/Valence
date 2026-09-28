import { describe, expect, it } from 'vitest';
import {
  AddPlaylistEntriesSchema,
  CreatePlaylistSchema,
  PlaylistSummarySchema,
  UpdatePlaylistSchema,
} from './Playlist';

describe('Playlist', () => {
  it('makes a playlist from a name alone', () => {
    expect(CreatePlaylistSchema.parse({ name: '  Sunday morning ' })).toEqual({
      name: 'Sunday morning',
    });
  });

  it('refuses a playlist with no name', () => {
    expect(CreatePlaylistSchema.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('shares a playlist in one change', () => {
    expect(UpdatePlaylistSchema.parse({ isShared: true })).toEqual({ isShared: true });
  });

  it('adds at least one thing at a time', () => {
    expect(AddPlaylistEntriesSchema.safeParse({ mediaItemIds: [] }).success).toBe(false);
  });

  it('says whether a playlist has a cover of its own', () => {
    const summary = {
      id: '00000000-0000-4000-8000-00000000d0d0',
      name: 'Sunday morning',
      description: null,
      isShared: false,
      isOrdered: false,
      isMine: true,
      owner: null,
      entryCount: 0,
      lostCount: 0,
      durationSeconds: 0,
      artworkAlbumIds: [],
      hasOwnArtwork: true,
      updatedAt: '2026-09-28T00:00:00.000Z',
    };

    expect(PlaylistSummarySchema.parse(summary).hasOwnArtwork).toBe(true);
    expect(PlaylistSummarySchema.safeParse({ ...summary, hasOwnArtwork: undefined }).success).toBe(
      false,
    );
  });
});
