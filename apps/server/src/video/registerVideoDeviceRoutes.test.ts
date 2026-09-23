import { OpenAPIHono, z } from '@hono/zod-openapi';
import { describe, expect, it, vi } from 'vitest';
import { VideoDeviceListSchema } from '@ValenceContracts/schemas/VideoRemote';
import { createVideoDevices } from '@ValenceServer/video/createVideoDevices';
import { registerVideoDeviceRoutes } from '@ValenceServer/video/registerVideoDeviceRoutes';
import type { PresenceEntry } from '@ValenceServer/presence/PresenceService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const ErrorSchema = z.object({ error: z.string() });

const entry = (clientId: string, profileId: string | null): PresenceEntry => ({
  clientId,
  accountId: 'acc',
  profileId,
  profileName: 'Marques',
  guestOf: null,
  viaShare: null,
  address: null,
  deviceLabel: `${clientId} label`,
  clientKind: clientId === 'tv' ? 'tv' : 'browser',
  connectedAt: 0,
  playback: null,
});

const ME: Viewer = { kind: 'account', accountId: 'acc', profileId: 'me', isAdministrator: false };

const NOW_WATCHING = {
  mediaId: '00000000-0000-4000-8000-000000000001',
  title: 'Arrival',
  subtitle: null,
  hasBackdrop: true,
  positionSeconds: 60,
  durationSeconds: 6000,
  isPlaying: true,
  reportedAtMs: 1,
};

const build = (viewer: Viewer | null = ME) => {
  const presence = {
    list: () => [entry('laptop', 'me'), entry('tv', 'me'), entry('theirs', 'them')],
    tell: vi.fn(() => true),
    watch: () => () => {},
  };
  const app = new OpenAPIHono();

  registerVideoDeviceRoutes(app, {
    viewerOf: () => Promise.resolve(viewer),
    devices: createVideoDevices({ presence }),
  });

  const post = (path: string, body: object) =>
    app.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  return { app, presence, post };
};

describe('registerVideoDeviceRoutes', () => {
  it('refuses to list devices when nobody is signed in', async () => {
    const response = await build(null).app.request('/api/video/devices');

    expect(response.status).toBe(401);
    expect(ErrorSchema.parse(await response.json()).error).toBe('Nobody is signed in.');
  });

  it('refuses to list devices for a guest on a shared link', async () => {
    const response = await build({ kind: 'guest', shareId: 'share-1' }).app.request(
      '/api/video/devices',
    );

    expect(response.status).toBe(401);
  });

  it('lists the devices of whoever is signed in, and nobody else’s', async () => {
    const response = await build().app.request('/api/video/devices');

    expect(response.status).toBe(200);
    expect(VideoDeviceListSchema.parse(await response.json()).devices).toEqual([
      { clientId: 'laptop', label: 'laptop label', kind: 'browser', nowWatching: null },
      { clientId: 'tv', label: 'tv label', kind: 'tv', nowWatching: null },
    ]);
  });

  it('hears what one of the person’s devices is watching, and lists it', async () => {
    const { app, post } = build();

    const response = await post('/api/video/devices/now-watching', {
      clientId: 'tv',
      nowWatching: NOW_WATCHING,
    });
    const listed = VideoDeviceListSchema.parse(
      await (await app.request('/api/video/devices')).json(),
    );

    expect(response.status).toBe(200);
    expect(listed.devices.find((device) => device.clientId === 'tv')?.nowWatching).toEqual(
      NOW_WATCHING,
    );
  });

  it('refuses a report for a device that is not the person’s', async () => {
    const response = await build().post('/api/video/devices/now-watching', {
      clientId: 'theirs',
      nowWatching: null,
    });

    expect(response.status).toBe(404);
  });

  it('refuses a report when nobody is signed in', async () => {
    const response = await build(null).post('/api/video/devices/now-watching', {
      clientId: 'tv',
      nowWatching: null,
    });

    expect(response.status).toBe(401);
  });

  it('refuses a report it cannot read', async () => {
    const response = await build().post('/api/video/devices/now-watching', { clientId: '' });

    expect(response.status).toBe(400);
  });

  it('sends a command to another of the person’s devices as a film presence event', async () => {
    const { presence, post } = build();

    const response = await post('/api/video/devices/tv/command', {
      fromClientId: 'laptop',
      command: { kind: 'seek', positionSeconds: 90 },
    });

    expect(response.status).toBe(200);
    expect(presence.tell).toHaveBeenCalledWith('tv', {
      kind: 'video',
      command: { kind: 'seek', positionSeconds: 90 },
      fromClientId: 'laptop',
      fromLabel: 'laptop label',
    });
  });

  it('refuses a command for a device that is not the person’s', async () => {
    const { presence, post } = build();

    const response = await post('/api/video/devices/theirs/command', {
      fromClientId: 'laptop',
      command: { kind: 'pause' },
    });

    expect(response.status).toBe(404);
    expect(presence.tell).not.toHaveBeenCalled();
  });

  it('refuses a command when nobody is signed in', async () => {
    const { presence, post } = build(null);

    const response = await post('/api/video/devices/tv/command', {
      fromClientId: 'laptop',
      command: { kind: 'pause' },
    });

    expect(response.status).toBe(401);
    expect(presence.tell).not.toHaveBeenCalled();
  });

  it('refuses a command it does not know', async () => {
    const response = await build().post('/api/video/devices/tv/command', {
      fromClientId: 'laptop',
      command: { kind: 'rewind' },
    });

    expect(response.status).toBe(400);
  });
});
