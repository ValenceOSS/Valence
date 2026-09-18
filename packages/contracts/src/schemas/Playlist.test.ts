import { describe, expect, it } from 'vitest';
import { AddPlaylistEntriesSchema, CreatePlaylistSchema, UpdatePlaylistSchema } from './Playlist';

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
});
