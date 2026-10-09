import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { ArrStatusSchema } from '@ValenceRequests/arrApps/schemas/ArrStatusSchema';
import { createArrCaller } from './createArrCaller';
import type { ArrFetch } from './createArrCaller';

const RADARR_STATUS = {
  appName: 'Radarr',
  instanceName: 'Radarr',
  version: '5.14.0.9383',
  buildTime: '2024-10-28T13:23:23Z',
  isDebug: false,
  isProduction: true,
  isAdmin: false,
  isUserInteractive: true,
  startupPath: '/app/radarr/bin',
  appData: '/config',
  osName: 'alpine',
  osVersion: '3.20.3',
  isNetCore: true,
  isLinux: true,
  isOsx: false,
  isWindows: false,
  isDocker: true,
  mode: 'console',
  branch: 'master',
  databaseType: 'sqLite',
  databaseVersion: '3.45.3',
  authentication: 'forms',
  migrationVersion: 238,
  urlBase: '',
  runtimeVersion: '6.0.35',
  runtimeName: '.NET',
  startTime: '2026-09-30T08:00:00Z',
  packageVersion: '5.14.0.9383-ls245',
  packageAuthor: '[linuxserver.io](https://linuxserver.io)',
  packageUpdateMechanism: 'docker',
};

describe('createArrCaller', () => {
  it('asks under the API root of its kind, with its key and the query given', async () => {
    const arr = aFakeArr({ 'GET /radarr/api/v3/system/status': { body: RADARR_STATUS } });
    const caller = createArrCaller(arr.fetch, anArrApp({ url: 'http://radarr:7878/radarr/' }));

    expect(await caller.read('/system/status', ArrStatusSchema, { a: 'b' })).toMatchObject({
      appName: 'Radarr',
      version: '5.14.0.9383',
    });
    expect(arr.asked[0]?.query.get('a')).toBe('b');
  });

  it('asks Overseerr and Jellyseerr under their own API root', async () => {
    const arr = aFakeArr({
      'GET /api/v1/status': { body: { version: '1.35.0', commitTag: 'v1.35.0' } },
    });
    const caller = createArrCaller(arr.fetch, {
      name: 'Overseerr',
      kind: 'overseerr',
      url: 'http://overseerr:5055',
      apiKey: 'overseerr-key',
    });

    expect(await caller.read('/status', ArrStatusSchema)).toMatchObject({ version: '1.35.0' });
  });

  it('sends a body as JSON, with the key in its header', async () => {
    const fetch = vi.fn<ArrFetch>(() => Promise.resolve(Response.json({ id: 7 })));
    const caller = createArrCaller(fetch, anArrApp({ kind: 'lidarr', url: 'http://lidarr:8686' }));

    await caller.send('POST', '/artist', { a: 1 }, z.object({ id: z.number() }));

    expect(fetch.mock.calls[0]?.[0]).toBe('http://lidarr:8686/api/v1/artist');
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'X-Api-Key': 'radarr-key', 'content-type': 'application/json' },
      body: '{"a":1}',
    });
  });

  it('reads an empty answer as nothing', async () => {
    const fetch = vi.fn<ArrFetch>(() => Promise.resolve(new Response(null, { status: 202 })));

    expect(
      await createArrCaller(fetch, anArrApp()).send('PUT', '/movie/editor', {}, z.null()),
    ).toBeNull();
  });

  it('deletes with the query given, reading whatever comes back as nothing', async () => {
    const arr = aFakeArr({ 'DELETE /api/v3/queue/41': { body: null } });

    await createArrCaller(arr.fetch, anArrApp()).remove('/queue/41', { blocklist: 'true' });

    expect(arr.asked.map((one) => [one.method, one.path, one.query.get('blocklist')])).toEqual([
      ['DELETE', '/api/v3/queue/41', 'true'],
    ]);
  });

  it('says an app could not be reached, or did not answer in time', async () => {
    const refused = vi.fn<ArrFetch>(() => Promise.reject(new Error('ECONNREFUSED')));
    const late = vi.fn<ArrFetch>(() =>
      Promise.reject(Object.assign(new Error('late'), { name: 'TimeoutError' })),
    );

    await expect(
      createArrCaller(refused, anArrApp()).read('/system/status', ArrStatusSchema),
    ).rejects.toMatchObject({
      message: 'Couldn’t connect to Radarr',
      problemCode: 'ArrAppUnreachable',
    });
    await expect(
      createArrCaller(late, anArrApp(), 3).read('/system/status', ArrStatusSchema),
    ).rejects.toMatchObject({
      message: 'Radarr didn’t respond within 3 seconds',
      problemCode: 'ArrAppUnreachable',
    });
  });

  it('says an app refused its key', async () => {
    const arr = aFakeArr({ 'GET /api/v3/system/status': { status: 401, body: null } });

    await expect(
      createArrCaller(arr.fetch, anArrApp()).read('/system/status', ArrStatusSchema),
    ).rejects.toMatchObject({
      message: 'Radarr rejected its API key',
      problemCode: 'ArrAppKeyRefused',
    });
  });

  it('passes on what an app said went wrong, and its status', async () => {
    const arr = aFakeArr({
      'POST /api/v3/movie': {
        status: 400,
        body: [
          {
            propertyName: 'TmdbId',
            errorMessage: 'This movie has already been added',
            attemptedValue: 438_631,
            severity: 'error',
            errorCode: 'MovieExistsValidator',
          },
        ],
      },
      'GET /api/v3/movie/9': { status: 404, body: { message: 'NotFound' } },
      'GET /api/v3/queue': { status: 500, body: 'Oops' },
    });
    const caller = createArrCaller(arr.fetch, anArrApp());

    await expect(caller.send('POST', '/movie', {}, ArrStatusSchema)).rejects.toMatchObject({
      message: 'Radarr returned HTTP 400: This movie has already been added',
      status: 400,
    });
    await expect(caller.read('/movie/9', ArrStatusSchema)).rejects.toMatchObject({
      message: 'Radarr returned HTTP 404: NotFound',
      status: 404,
    });
    await expect(caller.read('/queue', ArrStatusSchema)).rejects.toMatchObject({
      message: 'Radarr returned HTTP 500',
      status: 500,
    });
  });

  it('says so where an answer is not in a shape it can read', async () => {
    const fetch = vi.fn<ArrFetch>(() => Promise.resolve(new Response('<html>Sign in</html>')));

    await expect(
      createArrCaller(fetch, anArrApp()).read('/system/status', ArrStatusSchema),
    ).rejects.toMatchObject({
      message: 'Radarr sent a response Valence can’t read',
      problemCode: null,
    });
  });
});
