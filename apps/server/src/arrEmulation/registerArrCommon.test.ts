import { describe, expect, it } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { registerArrCommon } from './registerArrCommon';
import { anArrEmulation, SEERR_KEY } from './testing/anArrEmulation';

const BASE = 'http://valence/arr/test';

/**
 * What Radarr and Sonarr answer alike, under a base of its own.
 */
const build = () => {
  const app = new OpenAPIHono();

  registerArrCommon(
    app,
    '/arr/test',
    'film',
    { appName: 'Radarr', version: '3.0.0.1' },
    anArrEmulation().emulation,
  );

  return (path: string, method = 'GET', body?: object) =>
    app.request(`${BASE}/api/v3${path}?apikey=${SEERR_KEY}`, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
};

describe('registerArrCommon', () => {
  it('answers under the base it is given, naming it as its own', async () => {
    const ask = build();

    expect(await (await ask('/system/status')).json()).toMatchObject({
      appName: 'Radarr',
      version: '3.0.0.1',
      urlBase: '/arr/test',
    });
  });

  it('keeps everything under the base behind the key', async () => {
    const app = new OpenAPIHono();

    registerArrCommon(
      app,
      '/arr/test',
      'film',
      { appName: 'Radarr', version: '3' },
      anArrEmulation().emulation,
    );

    expect((await app.request(`${BASE}/anything`)).status).toBe(401);
  });

  it('is healthy where a library takes requests of its kind', async () => {
    expect(await (await build()('/health')).json()).toEqual([]);
  });

  it('says where no library takes requests of its kind, so nothing can be added', async () => {
    const app = new OpenAPIHono();

    registerArrCommon(
      app,
      '/arr/test',
      'film',
      { appName: 'Radarr', version: '3' },
      { ...anArrEmulation().emulation, libraries: () => Promise.resolve([]) },
    );

    expect(
      await (await app.request(`${BASE}/api/v3/health?apikey=${SEERR_KEY}`)).json(),
    ).toMatchObject([
      {
        type: 'error',
        message: 'No Valence films library takes requests, so films can’t be added',
      },
    ]);
  });

  it('gives the same tag the same id', async () => {
    const ask = build();
    const TagSchema = z.object({ id: z.number() });
    const first = TagSchema.parse(await (await ask('/tag', 'POST', { label: '1-pat' })).json());
    const again = TagSchema.parse(
      await (await ask('/tag/9', 'PUT', { id: 9, label: '1-pat' })).json(),
    );

    expect(again.id).toBe(first.id);
  });

  it('turns away a tag or a command that is not what was expected', async () => {
    const ask = build();

    expect((await ask('/tag', 'POST', { name: 'x' })).status).toBe(400);
    expect((await ask('/command', 'POST', { label: 'x' })).status).toBe(400);
  });

  it('lists an empty queue as Radarr does', async () => {
    expect(await (await build()('/queue')).json()).toEqual({
      page: 1,
      pageSize: 1,
      sortKey: 'timeleft',
      sortDirection: 'ascending',
      totalRecords: 0,
      records: [],
    });
  });
});
