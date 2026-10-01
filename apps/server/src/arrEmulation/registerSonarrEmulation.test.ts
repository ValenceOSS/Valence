import { describe, expect, it } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { arrIdOf } from './arrIdOf';
import { registerSonarrEmulation } from './registerSonarrEmulation';
import { aSeerrRequest } from './testing/aSeerrRequest';
import { anArrEmulation, SEERR_KEY, SHOWS_LIBRARY } from './testing/anArrEmulation';
import type { ArrEmulation } from './ArrEmulation';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';

const SeasonSchema = z
  .object({
    seasonNumber: z.number(),
    monitored: z.boolean(),
    statistics: z.object({ episodeFileCount: z.number() }).passthrough(),
  })
  .passthrough();

const SeriesListSchema = z.array(
  z
    .object({
      id: z.number().optional(),
      seasons: z.array(SeasonSchema),
      statistics: z.object({ episodeFileCount: z.number() }).passthrough(),
    })
    .passthrough(),
);

const API = 'http://valence:8420/arr/sonarr/api/v3';

const TVDB_ID = 305288;

const TMDB_ID = 66732;

const episode = (season: number, number: number) => ({
  season,
  episode: number,
  title: `Chapter ${number.toString()}`,
  airDate: '2016-07-15',
});

const STRANGER_THINGS: RequestCatalogue = {
  title: 'Stranger Things',
  year: 2016,
  aliases: [],
  overview: 'Kids, a lab, a monster.',
  posterUrl: null,
  runtimeMinutes: null,
  releaseDates: { theatrical: null, digital: null, physical: null },
  episodes: [episode(0, 1), episode(1, 1), episode(1, 2), episode(1, 3), episode(2, 1)],
  isEnded: true,
  artist: null,
  albums: [],
  tvdbId: TVDB_ID,
};

const SEERR_ADD_SERIES = {
  tvdbId: TVDB_ID,
  title: 'Stranger Things',
  qualityProfileId: 1,
  languageProfileId: 1,
  seasons: [
    { seasonNumber: 0, monitored: false },
    { seasonNumber: 1, monitored: true },
    { seasonNumber: 2, monitored: false },
  ],
  tags: [],
  seasonFolder: true,
  monitored: true,
  rootFolderPath: '/media/Series',
  seriesType: 'standard',
  addOptions: { ignoreEpisodesWithFiles: true, searchForMissingEpisodes: true },
};

const A_SERIES_REQUEST = aSeerrRequest({
  kind: 'series',
  tmdbId: TMDB_ID,
  title: 'Stranger Things',
  libraryId: SHOWS_LIBRARY.id,
  seasons: [1],
});

/**
 * Sonarr's stand-in on an application of its own, and a way to ask it things as Jellyseerr does,
 * with the key in the query.
 */
const build = (change: Partial<ArrEmulation> = {}) => {
  const app = new OpenAPIHono();
  const made = anArrEmulation({
    describe: (tmdbId) => Promise.resolve(tmdbId === TMDB_ID ? STRANGER_THINGS : null),
    seriesOfTvdbId: (tvdbId) => Promise.resolve(tvdbId === TVDB_ID ? TMDB_ID : null),
    ...change,
  });

  registerSonarrEmulation(app, made.emulation);

  const ask = (path: string, method = 'GET', body?: object) =>
    app.request(`${API}${path}${path.includes('?') ? '&' : '?'}apikey=${SEERR_KEY}`, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  return { app, ask, ...made };
};

describe('what the Test button reads', () => {
  it('says it is Sonarr 3, so Jellyseerr asks for language profiles', async () => {
    const { ask } = build();
    const status = z
      .object({ version: z.string() })
      .passthrough()
      .parse(await (await ask('/system/status')).json());

    expect(status).toMatchObject({ appName: 'Sonarr', urlBase: '/arr/sonarr' });
    expect(Number(status.version.split('.')[0])).toBeLessThanOrEqual(3);
  });

  it('offers one language profile, which Overseerr insists on', async () => {
    const { ask } = build();

    expect(await (await ask('/languageprofile')).json()).toEqual([{ id: 1, name: 'English' }]);
  });

  it('offers each series library that takes requests as a root folder', async () => {
    const { ask } = build();

    expect(await (await ask('/rootfolder')).json()).toEqual([
      expect.objectContaining({ id: arrIdOf(SHOWS_LIBRARY.id), path: '/media/Series' }),
    ]);
  });
});

describe('looking a series up by its TVDB id', () => {
  it('describes a series nobody has asked for without an id, with every season', async () => {
    const { ask } = build();
    const found = SeriesListSchema.parse(
      await (await ask(`/series/lookup?term=tvdb:${TVDB_ID.toString()}`)).json(),
    );

    expect(found).toHaveLength(1);
    expect(found[0]).not.toHaveProperty('id');
    expect(found[0]).toMatchObject({
      title: 'Stranger Things',
      tvdbId: TVDB_ID,
      tmdbId: TMDB_ID,
      tags: [],
      monitored: false,
    });
    expect(found[0]?.seasons.map((season) => season.seasonNumber)).toEqual([0, 1, 2]);
    expect(found[0]?.seasons.some((season) => season.monitored)).toBe(false);
    expect(found[0]?.seasons[1]).toMatchObject({
      statistics: { totalEpisodeCount: 3, episodeFileCount: 0 },
    });
  });

  it('describes a series already asked for with its id and the seasons asked for watched', async () => {
    const { ask } = build({ requests: () => Promise.resolve([A_SERIES_REQUEST]) });
    const [found] = SeriesListSchema.parse(
      await (await ask(`/series/lookup?term=tvdb:${TVDB_ID.toString()}`)).json(),
    );

    expect(found?.id).toBe(TMDB_ID);
    expect(found?.seasons.map((season) => season.monitored)).toEqual([false, true, false]);
  });

  it('finds nothing for a TVDB id the catalogue does not know', async () => {
    const { ask } = build();

    expect(await (await ask('/series/lookup?term=tvdb:1')).json()).toEqual([]);
    expect(await (await ask('/series/lookup?term=stranger')).json()).toEqual([]);
  });
});

describe('adding a series', () => {
  it('asks for the seasons Jellyseerr watched, found by the TVDB id it sent', async () => {
    const { ask, asks } = build({
      ask: () => Promise.resolve({ kind: 'asked', request: A_SERIES_REQUEST }),
    });
    const response = await ask('/series', 'POST', SEERR_ADD_SERIES);

    expect(response.status).toBe(201);
    expect(asks).toEqual([
      {
        kind: 'series',
        tmdbId: TMDB_ID,
        seasons: [1],
        profileId: undefined,
        libraryId: SHOWS_LIBRARY.id,
      },
    ]);
    expect(await response.json()).toMatchObject({
      id: TMDB_ID,
      tvdbId: TVDB_ID,
      titleSlug: TMDB_ID.toString(),
      monitored: true,
    });
  });

  it('asks for more seasons of a series already there when Overseerr puts it back', async () => {
    const { ask, asks } = build({
      ask: () => Promise.resolve({ kind: 'asked', request: A_SERIES_REQUEST }),
      seriesOfTvdbId: () => Promise.reject(new Error('The TMDB id was sent back.')),
    });
    const response = await ask('/series', 'PUT', {
      ...SEERR_ADD_SERIES,
      id: TMDB_ID,
      tmdbId: TMDB_ID,
      statistics: { episodeFileCount: 0 },
      seasons: [
        { seasonNumber: 1, monitored: true, statistics: { episodeFileCount: 0 } },
        { seasonNumber: 2, monitored: true },
      ],
    });

    expect(response.status).toBe(202);
    expect(asks[0]?.seasons).toEqual([1, 2]);
  });

  it('turns away a series the catalogue cannot find by its TVDB id', async () => {
    const { ask, asks } = build();
    const response = await ask('/series', 'POST', { ...SEERR_ADD_SERIES, tvdbId: 1 });

    expect(response.status).toBe(400);
    expect(asks).toEqual([]);
  });
});

describe('what Jellyseerr reads back', () => {
  it('lists each series asked for, with how much of each season is in the library', async () => {
    const { ask } = build({
      requests: () => Promise.resolve([A_SERIES_REQUEST]),
      episodesHeld: () => Promise.resolve(new Map([[1, 2]])),
    });
    const [series] = SeriesListSchema.parse(await (await ask('/series')).json());

    expect(series).toMatchObject({ id: TMDB_ID, tvdbId: TVDB_ID, titleSlug: '66732' });
    expect(series?.seasons[1]).toMatchObject({
      seasonNumber: 1,
      monitored: true,
      statistics: { episodeFileCount: 2, totalEpisodeCount: 3 },
    });
    expect(series?.statistics.episodeFileCount).toBe(2);
  });

  it('narrows the list to one series by its TVDB id', async () => {
    const { ask } = build({ requests: () => Promise.resolve([A_SERIES_REQUEST]) });

    expect(await (await ask('/series?tvdbId=1')).json()).toEqual([]);
    expect(await (await ask(`/series?tvdbId=${TVDB_ID.toString()}`)).json()).toHaveLength(1);
  });

  it('describes one series by its id, and says when it has none by that id', async () => {
    const { ask } = build({ requests: () => Promise.resolve([A_SERIES_REQUEST]) });

    expect((await ask(`/series/${TMDB_ID.toString()}`)).status).toBe(200);
    expect((await ask('/series/1')).status).toBe(404);
  });

  it('lists the episodes of a series, each with an id of its own', async () => {
    const { ask } = build({ requests: () => Promise.resolve([A_SERIES_REQUEST]) });
    const episodes = z
      .array(z.object({ id: z.number() }).passthrough())
      .parse(await (await ask(`/episode?seriesId=${TMDB_ID.toString()}`)).json());

    expect(episodes).toHaveLength(5);
    expect(new Set(episodes.map((one) => one.id)).size).toBe(5);
    expect(episodes[1]).toMatchObject({ seasonNumber: 1, episodeNumber: 1, monitored: true });
  });

  it('takes episodes being watched, which asking for their season already did', async () => {
    const { ask } = build();

    expect(
      (await ask('/episode/monitor', 'PUT', { episodeIds: [10_001], monitored: true })).status,
    ).toBe(202);
  });
});

describe('removing a series', () => {
  it('withdraws a request not yet in the library', async () => {
    const { ask, withdrawn } = build({ requests: () => Promise.resolve([A_SERIES_REQUEST]) });

    expect((await ask(`/series/${TMDB_ID.toString()}`, 'DELETE')).status).toBe(200);
    expect(withdrawn).toEqual([A_SERIES_REQUEST]);
  });
});
