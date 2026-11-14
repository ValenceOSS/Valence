import { describe, expect, it } from 'vitest';
import { jellyfinItemOfSeason } from './jellyfinItemOfSeason';
import { seasonJellyfinId } from './seasonJellyfinId';
import { showJellyfinId } from './showJellyfinId';
import { aJellyfinShow } from './testing/aJellyfinShow';

const viewing = { serverId: 'server', progress: new Map(), favourites: new Set<string>() };

describe('jellyfinItemOfSeason', () => {
  it('describes a season of the programme, numbered and counted', () => {
    const show = aJellyfinShow();
    const [first] = show.seasons;

    expect(first === undefined ? null : jellyfinItemOfSeason(show, first, viewing)).toMatchObject({
      Name: 'Season 1',
      Type: 'Season',
      Id: seasonJellyfinId(`${show.libraryId}:twin-peaks`, 1),
      SeriesId: showJellyfinId(show.libraryId, 'twin-peaks'),
      IndexNumber: 1,
      ChildCount: 1,
      UserData: { UnplayedItemCount: 1, Played: false },
    });
  });

  it('calls season nought the specials, and keeps a name the catalogue gives', () => {
    const show = aJellyfinShow({
      shape: [{ seasonNumber: 2, episodeCount: 1, name: 'The Second', episodes: [] }],
    });

    expect(jellyfinItemOfSeason(show, { seasonNumber: 0, episodes: [] }, viewing).Name).toBe(
      'Specials',
    );
    expect(jellyfinItemOfSeason(show, { seasonNumber: 2, episodes: [] }, viewing).Name).toBe(
      'The Second',
    );
  });
});
