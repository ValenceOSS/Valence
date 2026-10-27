import { describe, expect, it } from 'vitest';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { anAnimeShow } from '@ValenceRequests/testing/anAnimeShow';
import { episodesOfVideo } from './episodesOfVideo';

const SHOW = { title: 'Example Show', aliases: [], anime: null, numberingByGroup: null };

const EPISODES = [1, 2, 3].map((episode) =>
  aRequestItem({
    id: `e${episode.toString()}`,
    season: 1,
    episode,
    airDate: `2025-01-0${episode.toString()}`,
  }),
);

const heldBy = (name: string) => episodesOfVideo(name, SHOW, EPISODES).map((item) => item.id);

describe('episodesOfVideo', () => {
  it('reads the episodes a video numbers, in whatever folder it is', () => {
    expect(heldBy('Example.Show.S01.1080p/Example.Show.S01E02.1080p.WEB-DL.mkv')).toEqual(['e2']);
    expect(heldBy('Pack\\Example.Show.S01E01.mkv')).toEqual(['e1']);
  });

  it('reads every episode of a video that holds several', () => {
    expect(heldBy('Example.Show.S01E02E03.1080p.mkv')).toEqual(['e2', 'e3']);
  });

  it('reads an episode by the day it aired', () => {
    expect(heldBy('Example.Show.2025.01.03.1080p.WEB-DL.mkv')).toEqual(['e3']);
  });

  it('reads nothing from a video whose name numbers no episode', () => {
    expect(heldBy('Example.Show.S01.1080p/Featurette.mkv')).toEqual([]);
  });

  it('reads an anime’s episodes by any of the ways it numbers them', () => {
    const { anime, items } = anAnimeShow();
    const held = episodesOfVideo(
      'Batch/[Grp] Show - 13 [1080p].mkv',
      { title: 'Show', aliases: [], anime, numberingByGroup: null },
      items,
    );

    expect(held.map((item) => [item.season, item.episode])).toEqual([[1, 13]]);
  });
});
