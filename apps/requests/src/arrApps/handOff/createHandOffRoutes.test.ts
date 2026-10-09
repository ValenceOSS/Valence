import { describe, expect, it, vi } from 'vitest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { HandOffControl } from '@ValenceRequests/arrApps/handOff/createHandOffControl';
import type { RequestService } from '@ValenceRequests/mediaRequests/createRequestService';
import { showMediaRequest } from '@ValenceRequests/mediaRequests/showMediaRequest';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { createHandOffRoutes } from './createHandOffRoutes';

const REQUEST: MediaRequest = showMediaRequest(aMediaRequest(), []);

const ITEM_ID = '0b1d2c3e-4f56-4a78-9b01-23456789abcd';

/**
 * The routes over one request handed to an app, with a control that does as it is told.
 *
 * @returns How to ask them, the control and the requests.
 */
const theRoutes = () => {
  const control = {
    downloads: vi.fn<HandOffControl['downloads']>(() =>
      Promise.resolve({ kind: 'done', value: [] }),
    ),
    stop: vi.fn<HandOffControl['stop']>(() => Promise.resolve({ kind: 'done', value: [ITEM_ID] })),
    blocklist: vi.fn<HandOffControl['blocklist']>(() =>
      Promise.resolve({ kind: 'done', value: [] }),
    ),
    lift: vi.fn<HandOffControl['lift']>(() => Promise.resolve({ kind: 'done', value: true })),
    follow: vi.fn<HandOffControl['follow']>(() => Promise.resolve({ kind: 'done', value: true })),
    release: vi.fn<HandOffControl['release']>(() => Promise.resolve({ kind: 'done', value: true })),
  };
  const service = {
    find: vi.fn<RequestService['find']>((id) =>
      Promise.resolve(id === REQUEST.id ? REQUEST : null),
    ),
    follow: vi.fn<RequestService['follow']>(() => Promise.resolve(REQUEST)),
  };
  const routes = createHandOffRoutes({ service, control });

  const ask = (path: string, method = 'GET', body?: object) =>
    routes.request(path, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  return { ask, control, service };
};

describe('createHandOffRoutes', () => {
  it('lists a request’s downloads and blocklist in its app, and lifts an entry', async () => {
    const { ask, control } = theRoutes();

    expect(await (await ask(`/requests/${REQUEST.id}/hand-off/downloads`)).json()).toEqual([]);
    expect(await (await ask(`/requests/${REQUEST.id}/hand-off/blocklist`)).json()).toEqual([]);
    expect((await ask(`/requests/${REQUEST.id}/hand-off/blocklist/3`, 'DELETE')).status).toBe(204);
    expect(control.lift).toHaveBeenCalledWith(REQUEST.id, '3');
  });

  it('stops a download, and stops following what it held where nothing else is wanted', async () => {
    const { ask, control, service } = theRoutes();

    expect(
      (
        await ask(`/requests/${REQUEST.id}/hand-off/downloads/5/stop`, 'POST', {
          next: 'another',
        })
      ).status,
    ).toBe(200);
    expect(service.follow).not.toHaveBeenCalled();

    await ask(`/requests/${REQUEST.id}/hand-off/downloads/5/stop`, 'POST', { next: 'nothing' });

    expect(control.stop).toHaveBeenLastCalledWith(REQUEST.id, '5', 'nothing');
    expect(service.follow).toHaveBeenCalledWith(REQUEST.id, {
      itemIds: [ITEM_ID],
      isFollowed: false,
    });
    expect(
      (await ask(`/requests/${REQUEST.id}/hand-off/downloads/5/stop`, 'POST', {})).status,
    ).toBe(400);
  });

  it('follows in the app first, and in Valence only once the app has', async () => {
    const { ask, control, service } = theRoutes();
    const following = { itemIds: [ITEM_ID], isFollowed: true };

    expect((await ask(`/requests/${REQUEST.id}/hand-off/follow`, 'POST', following)).status).toBe(
      200,
    );
    expect(service.follow).toHaveBeenCalledWith(REQUEST.id, following);

    control.follow.mockResolvedValue({ kind: 'failed', problem: sayVerbatim('Radarr said no') });
    service.follow.mockClear();

    const refused = await ask(`/requests/${REQUEST.id}/hand-off/follow`, 'POST', following);

    expect(refused.status).toBe(400);
    expect(await refused.json()).toMatchObject({ error: 'Radarr said no' });
    expect(service.follow).not.toHaveBeenCalled();
  });

  it('lets the app stop monitoring a request, and says where it was not handed to one', async () => {
    const { ask, control } = theRoutes();

    expect((await ask(`/requests/${REQUEST.id}/hand-off/release`, 'POST')).status).toBe(204);

    control.release.mockResolvedValue({ kind: 'notHandedOff' });

    expect((await ask(`/requests/${REQUEST.id}/hand-off/release`, 'POST')).status).toBe(404);
  });
});
