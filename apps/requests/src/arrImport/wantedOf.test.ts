import { describe, expect, it } from 'vitest';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { readSeerrSetup } from '@ValenceRequests/arrImport/readSeerrSetup';
import { aSetup } from '@ValenceRequests/arrImport/testing/aSetup';
import { arrFixture } from '@ValenceRequests/arrImport/testing/arrFixture';
import type { ArrSetup, SourceRead } from '@ValenceRequests/arrImport/ArrSetup';
import { wantedOf } from './wantedOf';

const PLACING = {
  libraryOf: (path: string | null) => (path === null ? null : `library:${path}`),
  profileOf: (_setup: ArrSetup, id: number | null | undefined) =>
    id === null || id === undefined ? null : `profile:${id.toString()}`,
};

/**
 * An Overseerr or Jellyseerr as it is read from one of the recorded apps.
 */
const aSeerr = (fixture: 'overseerr' | 'jellyseerr') => {
  const source: SourceRead = {
    kind: fixture,
    url: `http://${fixture}:5055`,
    apiKey: 'key',
    name: fixture,
    version: null,
    foundThrough: null,
    problem: null,
  };

  return readSeerrSetup(createArrCaller(aFakeArr(arrFixture(fixture)).fetch, source), source);
};

describe('wantedOf', () => {
  it('asks for each monitored film that has no file yet', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');

    expect(wantedOf({ arrs: [radarr], seerrs: [] }, PLACING)).toEqual({
      wanted: [
        {
          key: 'film:693134',
          kind: 'film',
          tmdbId: 693_134,
          tvdbId: null,
          musicBrainzId: null,
          title: 'Dune: Part Two',
          seasons: null,
          libraryId: 'library:/movies/',
          profileId: 'profile:4',
          isApproved: true,
          requester: null,
        },
      ],
      unaskable: 0,
    });
  });

  it('asks for a series’ monitored seasons still missing episodes, by TVDB id where it has no other', async () => {
    const sonarr = await aSetup('sonarr-v3', 'sonarr', 'http://sonarr:8989');

    expect(wantedOf({ arrs: [sonarr], seerrs: [] }, PLACING).wanted).toEqual([
      expect.objectContaining({
        key: 'series:tvdb:371980',
        tmdbId: null,
        tvdbId: 371_980,
        seasons: [2],
        libraryId: 'library:/tv',
      }),
    ]);
  });

  it('asks for a monitored artist missing tracks, and counts what has no id to ask by', async () => {
    const lidarr = await aSetup('lidarr-v2', 'lidarr', 'http://lidarr:8686');
    const read = wantedOf(
      {
        arrs: [
          {
            ...lidarr,
            artists: [
              ...lidarr.artists,
              { id: 9, foreignArtistId: 'not-an-id', artistName: 'Odd', monitored: true },
            ],
          },
        ],
        seerrs: [],
      },
      PLACING,
    );

    expect(read.wanted.map((one) => one.musicBrainzId)).toEqual([
      'a74b1b7f-71a5-4011-9441-d0b5e4122711',
    ]);
    expect(read.unaskable).toBe(1);
  });

  it('carries Overseerr’s waiting requests with who asked, and merges one Sonarr also watches', async () => {
    const sonarr = await aSetup('sonarr-v4', 'sonarr', 'http://sonarr:8989');
    const overseerr = await aSeerr('overseerr');
    const { wanted } = wantedOf({ arrs: [sonarr], seerrs: [overseerr] }, PLACING);

    expect(wanted).toEqual([
      expect.objectContaining({
        key: 'series:95396',
        seasons: [2, 3],
        isApproved: true,
        profileId: 'profile:7',
        requester: {
          name: 'Alex',
          email: 'alex@example.com',
          plexId: 7_654_321,
          jellyfinUserId: null,
        },
      }),
      expect.objectContaining({
        key: 'film:603',
        isApproved: false,
        libraryId: 'library:/movies',
        requester: {
          name: 'Sam',
          email: 'sam@example.com',
          plexId: 1_234_567,
          jellyfinUserId: null,
        },
      }),
    ]);
  });

  it('reads Jellyseerr’s numbering, where 6 is a blocklisted title rather than a deleted one', async () => {
    const jellyseerr = await aSeerr('jellyseerr');
    const { wanted } = wantedOf({ arrs: [], seerrs: [jellyseerr] }, PLACING);

    expect(wanted).toEqual([
      expect.objectContaining({
        key: 'film:157336',
        libraryId: null,
        requester: {
          name: 'Robin',
          email: null,
          plexId: null,
          jellyfinUserId: '6f1a2b3c4d5e6f708192a3b4c5d6e7f8',
        },
      }),
    ]);
  });
});
