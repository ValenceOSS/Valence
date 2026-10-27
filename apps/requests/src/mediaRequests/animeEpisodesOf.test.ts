import { describe, expect, it } from 'vitest';
import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import { anAnimeShow } from '@ValenceRequests/testing/anAnimeShow';
import { animeEpisodesOf } from './animeEpisodesOf';

const { anime, items } = anAnimeShow();

const SHOW = { title: 'Show', aliases: [], anime, numberingByGroup: null };

const heldBy = (name: string, releaseTitle: string | null = null) =>
  animeEpisodesOf(
    SHOW,
    items.map((item) => ({ ...item, releaseTitle })),
    parseReleaseName(name.slice(0, name.lastIndexOf('.'))),
    name,
  );

describe('animeEpisodesOf', () => {
  it('reads a file counted from the first episode', () => {
    expect(heldBy('[Grp] Show - 13 [1080p].mkv')).toEqual([
      expect.objectContaining({ season: 1, episode: 13 }),
    ]);
  });

  it('reads a file named for a cour by its place in that cour', () => {
    expect(heldBy('[Grp] Show Final Season - 02 [1080p].mkv')).toEqual([
      expect.objectContaining({ season: 2, episode: 2 }),
    ]);
  });

  it('reads nothing from a file whose name numbers no episode', () => {
    expect(heldBy('[Grp] Show - Opening [1080p].mkv')).toEqual([]);
  });
});
