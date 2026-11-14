import { describe, expect, it } from 'vitest';
import { jellyfinItemOfMedia } from './jellyfinItemOfMedia';
import { personJellyfinId } from './personJellyfinId';
import { seasonJellyfinId } from './seasonJellyfinId';
import { showJellyfinId } from './showJellyfinId';
import { aJellyfinDetail } from './testing/aJellyfinDetail';
import { aJellyfinEpisode } from './testing/aJellyfinEpisode';
import { aJellyfinFilm } from './testing/aJellyfinFilm';

const viewing = { serverId: 'server', progress: new Map(), favourites: new Set<string>() };

describe('jellyfinItemOfMedia', () => {
  it('describes a film in its library, with its poster as the primary picture', () => {
    expect(jellyfinItemOfMedia(aJellyfinFilm(), viewing)).toMatchObject({
      Name: 'Sneakers',
      Type: 'Movie',
      Id: '0f8fad5bd9cb469fa16570867728950e',
      ParentId: '7c9e6679742540de944be07fc1f90ae7',
      ProductionYear: 1992,
      RunTimeTicks: 75_600_000_000,
      ImageTags: {
        Primary: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        Thumb: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      },
      BackdropImageTags: ['bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'],
    });
  });

  it('places an episode in its season and programme, with its still as the primary picture', () => {
    const episode = aJellyfinEpisode();
    const showKey = `${episode.libraryId}:twin-peaks`;

    expect(jellyfinItemOfMedia(episode, viewing)).toMatchObject({
      Type: 'Episode',
      SeriesName: 'Twin Peaks',
      SeriesId: showJellyfinId(episode.libraryId, 'twin-peaks'),
      SeasonId: seasonJellyfinId(showKey, 1),
      ParentId: seasonJellyfinId(showKey, 1),
      IndexNumber: 1,
      ParentIndexNumber: 1,
      SeriesPrimaryImageTag: 'cccccccccccccccccccccccccccccccc',
      ImageTags: { Primary: 'dddddddddddddddddddddddddddddddd' },
      BackdropImageTags: ['eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
    });
  });

  it('adds the story, the cast and the ways to play it where the item itself was asked for', () => {
    const film = aJellyfinFilm();
    const item = jellyfinItemOfMedia(film, viewing, aJellyfinDetail(film));

    expect(item.Overview).toBe('Hackers are blackmailed into stealing a black box.');
    expect(item.People).toEqual([
      { Name: 'Robert Redford', Id: personJellyfinId(3), Role: 'Martin Bishop', Type: 'Actor' },
    ]);
    expect(item.MediaSources).toHaveLength(1);
    expect(item.MediaStreams).toHaveLength(3);
  });

  it('leaves out what Valence has nothing for', () => {
    expect(
      jellyfinItemOfMedia(aJellyfinFilm({ year: null, artwork: {} }), viewing),
    ).not.toHaveProperty('ProductionYear');
  });
});
