import { describe, expect, it } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import { SeerrLinkSchema } from '@ValenceContracts/schemas/SeerrLink';
import { createMemorySettingsStore } from '@ValenceServer/settings/createMemorySettingsStore';
import { ServerSettingsSchema } from '@ValenceServer/settings/ServerSettings';
import { registerSeerrLinkRoutes } from './registerSeerrLinkRoutes';

/**
 * The endpoints on an application of their own, for somebody who may manage requesting or not.
 */
const build = ({ mayManage = true, isRequestingOn = true } = {}) => {
  const app = new OpenAPIHono();
  const settings = createMemorySettingsStore(
    ServerSettingsSchema.parse({ trustedOrigins: [], cookieSecure: false, setupCompletedAt: null }),
  );

  registerSeerrLinkRoutes(app, {
    settings,
    mayManage: () => Promise.resolve(mayManage),
    isRequestingOn,
    accountExists: (accountId) => Promise.resolve(accountId === 'a1'),
  });

  const ask = async (path: string, method = 'GET', body?: object) => {
    const response = await app.request(`http://valence${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    return {
      status: response.status,
      link: SeerrLinkSchema.safeParse(await response.json()).data ?? null,
    };
  };

  return { ask, settings };
};

describe('registerSeerrLinkRoutes', () => {
  it('starts off, with no key, and says where Radarr and Sonarr answer', async () => {
    const { ask } = build();
    const { status, link } = await ask('/api/requests/seerr');

    expect(status).toBe(200);
    expect(link).toEqual({
      isEnabled: false,
      apiKey: '',
      accountId: '',
      isRequestingOn: true,
      radarrPath: '/arr/radarr',
      sonarrPath: '/arr/sonarr',
    });
  });

  it('makes a key the first time it is turned on, and keeps it after', async () => {
    const { ask } = build();
    const first = await ask('/api/requests/seerr', 'PUT', { isEnabled: true, accountId: 'a1' });

    expect(first.link).toMatchObject({ isEnabled: true, accountId: 'a1' });
    expect(first.link?.apiKey).toMatch(/^[0-9a-f]{32}$/);

    const second = await ask('/api/requests/seerr', 'PUT', { isEnabled: false, accountId: 'a1' });

    expect(second.link).toMatchObject({ isEnabled: false, apiKey: first.link?.apiKey });
  });

  it('makes a new key on asking, so the old one stops working', async () => {
    const { ask } = build();
    const before = await ask('/api/requests/seerr', 'PUT', { isEnabled: true, accountId: '' });
    const after = await ask('/api/requests/seerr/key', 'POST');

    expect(after.status).toBe(200);
    expect(after.link?.apiKey).toMatch(/^[0-9a-f]{32}$/);
    expect(after.link?.apiKey).not.toBe(before.link?.apiKey);
  });

  it('refuses an account that is not on the server', async () => {
    const { ask, settings } = build();
    const { status } = await ask('/api/requests/seerr', 'PUT', { isEnabled: true, accountId: 'x' });

    expect(status).toBe(400);
    expect((await settings.read()).seerr.isEnabled).toBe(false);
  });

  it('says whether requesting is on', async () => {
    const { ask } = build({ isRequestingOn: false });

    expect((await ask('/api/requests/seerr')).link?.isRequestingOn).toBe(false);
  });

  it('is for whoever manages requesting', async () => {
    const { ask } = build({ mayManage: false });

    expect((await ask('/api/requests/seerr')).status).toBe(403);
    expect(
      (await ask('/api/requests/seerr', 'PUT', { isEnabled: true, accountId: '' })).status,
    ).toBe(403);
    expect((await ask('/api/requests/seerr/key', 'POST')).status).toBe(403);
  });
});
