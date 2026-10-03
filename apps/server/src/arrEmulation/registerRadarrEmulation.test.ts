import { describe, expect, it } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { arrIdOf } from './arrIdOf';
import { registerRadarrEmulation } from './registerRadarrEmulation';
import { aSeerrRequest } from './testing/aSeerrRequest';
import { anArrEmulation, FILMS_LIBRARY, SEERR_KEY } from './testing/anArrEmulation';
import type { ArrEmulation } from './ArrEmulation';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';

const MoviesSchema = z.array(z.object({ tmdbId: z.number() }).passthrough());

const API = 'http://valence:8420/arr/radarr/api/v3';

const ARRIVAL: RequestCatalogue = {
  title: 'Arrival',
  year: 2016,
  aliases: [],
  overview: 'Linguist meets visitors.',
  posterUrl: 'https://image.tmdb.org/t/p/w342/arrival.jpg',
  runtimeMinutes: 116,
  releaseDates: { theatrical: null, digital: null, physical: null },
  episodes: [],
  isEnded: false,
  artist: null,
  albums: [],
};

const HD = { id: '0f8fad5b-d9cb-469f-a165-70867728950e', name: 'HD-1080p' };

const SEERR_ADD_MOVIE = {
  title: 'Arrival',
  qualityProfileId: arrIdOf(HD.id),
  profileId: arrIdOf(HD.id),
  titleSlug: '329865',
  minimumAvailability: 'released',
  tmdbId: 329865,
  year: 2016,
  rootFolderPath: '/media/Films',
  monitored: true,
  tags: [],
  addOptions: { searchForMovie: true },
};

/**
 * Radarr's stand-in on an application of its own, and a way to ask it things as Overseerr does,
 * with the key in the query.
 */
const build = (change: Partial<ArrEmulation> = {}) => {
  const app = new OpenAPIHono();
  const made = anArrEmulation({
    describe: (tmdbId) => Promise.resolve(tmdbId === 329865 ? ARRIVAL : null),
    profiles: () => Promise.resolve([HD]),
    ...change,
  });

  registerRadarrEmulation(app, made.emulation);

  const ask = (path: string, method = 'GET', body?: object, key = SEERR_KEY) =>
    app.request(`${API}${path}${path.includes('?') ? '&' : '?'}apikey=${key}`, {
      method,
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  return { app, ask, ...made };
};

describe('the key', () => {
  it('turns away a request without the key Valence made', async () => {
    const { app } = build();

    expect((await app.request(`${API}/system/status`)).status).toBe(401);
  });

  it('turns away a request with another key', async () => {
    const { ask } = build();

    expect((await ask('/system/status', 'GET', undefined, 'wrong')).status).toBe(401);
  });

  it('takes the key in the X-Api-Key header too', async () => {
    const { app } = build();
    const response = await app.request(`${API}/system/status`, {
      headers: { 'X-Api-Key': SEERR_KEY },
    });

    expect(response.status).toBe(200);
  });

  it('is not there at all while answering Overseerr is turned off', async () => {
    const { ask } = build({
      readLink: () => Promise.resolve({ isEnabled: false, apiKey: SEERR_KEY, accountId: 'a1' }),
    });

    expect((await ask('/system/status')).status).toBe(404);
  });

  it('says requesting is off rather than pretending to take films', async () => {
    const { ask } = build({ isRequestingOn: false });

    expect((await ask('/system/status')).status).toBe(503);
  });
});

describe('what the Test button reads', () => {
  it('says it is Radarr, and the base it answers under', async () => {
    const { ask } = build();
    const status = z
      .object({ appName: z.string(), urlBase: z.string(), version: z.string() })
      .parse(await (await ask('/system/status')).json());

    expect(status).toMatchObject({ appName: 'Radarr', urlBase: '/arr/radarr' });
    expect(status.version).toMatch(/^3\./);
  });

  it('offers the library default first, then each quality profile, under both spellings', async () => {
    const { ask } = build();

    for (const path of ['/qualityProfile', '/qualityprofile']) {
      const profiles = await (await ask(path)).json();

      expect(profiles).toEqual([
        expect.objectContaining({ id: 1, name: 'Library default' }),
        expect.objectContaining({ id: arrIdOf(HD.id), name: 'HD-1080p' }),
      ]);
    }
  });

  it('offers each film library that takes requests as a root folder', async () => {
    const { ask } = build();

    expect(await (await ask('/rootfolder')).json()).toEqual([
      expect.objectContaining({
        id: arrIdOf(FILMS_LIBRARY.id),
        path: '/media/Films',
        freeSpace: 1000,
        totalSpace: 4000,
      }),
    ]);
  });

  it('has no tags, and gives a tag asked for an id that is not nought', async () => {
    const { ask } = build();

    expect(await (await ask('/tag')).json()).toEqual([]);

    const made = await ask('/tag', 'POST', { label: '1 - Pat' });

    expect(made.status).toBe(201);
    expect(
      z.object({ id: z.number().positive(), label: z.string() }).parse(await made.json()).label,
    ).toBe('1 - Pat');
  });
});

describe('looking a film up', () => {
  it('describes a film nobody has asked for without an id, so Overseerr adds it', async () => {
    const { ask } = build();
    const found = MoviesSchema.parse(await (await ask('/movie/lookup?term=tmdb:329865')).json());

    expect(found).toHaveLength(1);
    expect(found[0]).not.toHaveProperty('id');
    expect(found[0]).toMatchObject({
      title: 'Arrival',
      tmdbId: 329865,
      year: 2016,
      hasFile: false,
      monitored: false,
      tags: [],
      titleSlug: '329865',
    });
  });

  it('describes a film already asked for with its id, watched', async () => {
    const { ask } = build({ requests: () => Promise.resolve([aSeerrRequest()]) });
    const [found] = MoviesSchema.parse(await (await ask('/movie/lookup?term=tmdb:329865')).json());

    expect(found).toMatchObject({ id: 329865, monitored: true, hasFile: false });
  });

  it('says a film in the library has its file, so Overseerr leaves it be', async () => {
    const { ask } = build({ filmsHeld: () => Promise.resolve(new Map([['329865', 'm1']])) });
    const [found] = MoviesSchema.parse(await (await ask('/movie/lookup?term=tmdb:329865')).json());

    expect(found).toMatchObject({ id: 329865, hasFile: true });
  });

  it('finds nothing the catalogue does not know, or by any other kind of term', async () => {
    const { ask } = build();

    expect(await (await ask('/movie/lookup?term=tmdb:1')).json()).toEqual([]);
    expect(await (await ask('/movie/lookup?term=arrival')).json()).toEqual([]);
  });
});

describe('adding a film', () => {
  const asked = aSeerrRequest({ profileId: HD.id });

  it('asks for it, approved, in the quality and library Overseerr chose', async () => {
    const { ask, asks } = build({
      ask: () => Promise.resolve({ kind: 'asked', request: asked }),
    });
    const response = await ask('/movie', 'POST', SEERR_ADD_MOVIE);

    expect(response.status).toBe(201);
    expect(asks).toEqual([
      {
        kind: 'film',
        tmdbId: 329865,
        seasons: null,
        profileId: HD.id,
        libraryId: FILMS_LIBRARY.id,
      },
    ]);
    expect(await response.json()).toMatchObject({
      id: 329865,
      titleSlug: '329865',
      monitored: true,
      qualityProfileId: arrIdOf(HD.id),
      rootFolderPath: '/media/Films',
    });
  });

  it('leaves the quality to the library where Overseerr chose the first profile', async () => {
    const { ask, asks } = build({
      ask: () => Promise.resolve({ kind: 'asked', request: asked }),
    });

    await ask('/movie', 'POST', { ...SEERR_ADD_MOVIE, qualityProfileId: 1, profileId: 1 });

    expect(asks[0]?.profileId).toBeUndefined();
  });

  it('watches a film Overseerr found unwatched when it puts it back', async () => {
    const { ask } = build({ ask: () => Promise.resolve({ kind: 'asked', request: asked }) });
    const response = await ask('/movie', 'PUT', {
      ...SEERR_ADD_MOVIE,
      id: 329865,
      monitored: true,
      hasFile: false,
    });

    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ monitored: true, id: 329865 });
  });

  it('says why where Valence would not ask for it', async () => {
    const { ask } = build({
      ask: () =>
        Promise.resolve({ kind: 'refused', status: 403, message: 'Select the account first.' }),
    });
    const response = await ask('/movie', 'POST', SEERR_ADD_MOVIE);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: 'Select the account first.' });
  });

  it('turns away a body with no TMDB id', async () => {
    const { ask, asks } = build();

    expect((await ask('/movie', 'POST', { title: 'Arrival' })).status).toBe(400);
    expect(asks).toEqual([]);
  });
});

describe('what Overseerr reads back', () => {
  it('lists every film asked for and not refused, with its file once it is filed', async () => {
    const { ask } = build({
      requests: () =>
        Promise.resolve([
          aSeerrRequest(),
          aSeerrRequest({ tmdbId: 27205, title: 'Inception', state: 'filed' }),
          aSeerrRequest({ tmdbId: 11, title: 'Refused', approval: 'refused' }),
          aSeerrRequest({ kind: 'series', tmdbId: 66732 }),
        ]),
    });
    const movies = await (await ask('/movie')).json();

    expect(movies).toEqual([
      expect.objectContaining({ id: 329865, tmdbId: 329865, hasFile: false, monitored: true }),
      expect.objectContaining({ id: 27205, tmdbId: 27205, hasFile: true, monitored: true }),
    ]);
  });

  it('narrows the list to one film by its TMDB id', async () => {
    const { ask } = build({
      requests: () => Promise.resolve([aSeerrRequest(), aSeerrRequest({ tmdbId: 27205 })]),
    });

    expect(await (await ask('/movie?tmdbId=27205')).json()).toEqual([
      expect.objectContaining({ tmdbId: 27205 }),
    ]);
  });

  it('describes one film by its id, and says when it has none by that id', async () => {
    const { ask } = build({ requests: () => Promise.resolve([aSeerrRequest()]) });

    expect(await (await ask('/movie/329865')).json()).toMatchObject({ id: 329865, tmdbId: 329865 });
    expect((await ask('/movie/27205')).status).toBe(404);
  });

  it('lists the downloads films are waiting on as the queue', async () => {
    const download: QueuedDownload = {
      id: '4f9c1e2a-3b5d-4c6e-8f7a-9b0c1d2e3f4a',
      clientId: '5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d',
      clientName: 'qBittorrent',
      protocol: 'torrent',
      libraryKind: 'movies',
      title: 'Arrival.2016.1080p',
      indexerName: 'Jackett',
      state: 'downloading',
      problem: null,
      problemCode: null,
      progress: 0.5,
      sizeBytes: 1000,
      doneBytes: 500,
      downloadBytesPerSecond: 10,
      uploadBytesPerSecond: 0,
      secondsLeft: 50,
      seeds: 1,
      peers: 1,
      sentAt: '2026-10-01T10:00:00.000Z',
      finishedAt: null,
      filedInto: null,
      filingProblem: null,
      filingProblemCode: null,
    };
    const request = aSeerrRequest({
      state: 'downloading',
      items: [
        {
          id: '7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a0b',
          musicBrainzId: null,
          season: null,
          episode: null,
          title: 'Arrival',
          airDate: null,
          state: 'downloading',
          problem: null,
          problemCode: null,
          releaseTitle: 'Arrival.2016.1080p',
          downloadId: download.id,
          filePath: null,
          score: null,
          lastSearchedAt: null,
          updatedAt: '2026-10-01T10:00:00.000Z',
        },
      ],
    });
    const { ask } = build({
      requests: () => Promise.resolve([request]),
      downloads: () => Promise.resolve([download]),
    });
    const queue = z
      .object({ records: z.array(z.object({ estimatedCompletionTime: z.string() }).passthrough()) })
      .parse(await (await ask('/queue?includeEpisode=true')).json());

    expect(queue.records).toEqual([
      expect.objectContaining({
        movieId: 329865,
        size: 1000,
        sizeleft: 500,
        status: 'downloading',
        timeleft: '00:00:50',
        title: 'Arrival.2016.1080p',
        downloadId: download.id,
      }),
    ]);
    expect(new Date(queue.records[0]?.estimatedCompletionTime ?? '').getTime()).not.toBeNaN();
  });

  it('takes a search command, which Valence does by itself anyway', async () => {
    const { ask } = build();
    const response = await ask('/command', 'POST', { name: 'MoviesSearch', movieIds: [329865] });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ name: 'MoviesSearch' });
  });
});

describe('removing a film', () => {
  it('withdraws a request not yet in the library', async () => {
    const request = aSeerrRequest();
    const { ask, withdrawn } = build({ requests: () => Promise.resolve([request]) });

    expect(
      (await ask('/movie/329865?deleteFiles=true&addImportExclusion=false', 'DELETE')).status,
    ).toBe(200);
    expect(withdrawn).toEqual([request]);
  });

  it('never deletes what is already in the library', async () => {
    const { ask, withdrawn } = build({
      requests: () => Promise.resolve([aSeerrRequest({ state: 'available' })]),
    });

    expect((await ask('/movie/329865', 'DELETE')).status).toBe(200);
    expect(withdrawn).toEqual([]);
  });

  it('says when there is nothing by that id', async () => {
    const { ask } = build();

    expect((await ask('/movie/1', 'DELETE')).status).toBe(404);
  });
});
