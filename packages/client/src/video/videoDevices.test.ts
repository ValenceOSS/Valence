import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { writeCurrentProfile } from '@ValenceClient/profiles/currentProfile';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import {
  fetchVideoDevices,
  reportNowWatching,
  sendVideoCommand,
} from '@ValenceClient/video/videoDevices';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

const answerWith = (body: JsonValue, ok = true) => {
  fetchMock.mockResolvedValue({ ok, status: ok ? 200 : 404, json: () => Promise.resolve(body) });
};

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

beforeEach(() => {
  installPlatform(aFakePlatform({ thisClientId: () => 'this-tab' }));
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('videoDevices', () => {
  it('reads the devices this profile has open, and what each is watching', async () => {
    answerWith({
      devices: [{ clientId: 'tv', label: 'Living room', kind: 'tv', nowWatching: NOW_WATCHING }],
    });

    await expect(fetchVideoDevices()).resolves.toEqual([
      { clientId: 'tv', label: 'Living room', kind: 'tv', nowWatching: NOW_WATCHING },
    ]);
    expect(fetchMock).toHaveBeenCalledWith('/api/video/devices', expect.anything());
  });

  it('asks for the devices of whoever is watching here', async () => {
    writeCurrentProfile('11111111-1111-4111-8111-111111111111');
    answerWith({ devices: [] });

    await fetchVideoDevices();

    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      'x-valence-profile': '11111111-1111-4111-8111-111111111111',
    });
  });

  it('refuses an answer shaped in a way it does not understand', async () => {
    answerWith({ devices: [{ clientId: '' }] });

    await expect(fetchVideoDevices()).rejects.toThrow();
  });

  it('reports what this device is watching, as this device', async () => {
    answerWith({ ok: true });

    await expect(reportNowWatching(NOW_WATCHING)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/video/devices/now-watching',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ clientId: 'this-tab', nowWatching: NOW_WATCHING }),
      }),
    );
  });

  it('reports that it has stopped watching', async () => {
    answerWith({ ok: true });

    await reportNowWatching(null);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/video/devices/now-watching',
      expect.objectContaining({ body: JSON.stringify({ clientId: 'this-tab', nowWatching: null }) }),
    );
  });

  it('says a report was not heard where the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(reportNowWatching(null)).resolves.toBe(false);
  });

  it('sends a command to another device, saying where it came from', async () => {
    answerWith({ ok: true });

    await expect(sendVideoCommand('living room', { kind: 'pause' })).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/video/devices/living%20room/command',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ fromClientId: 'this-tab', command: { kind: 'pause' } }),
      }),
    );
  });

  it('says a command did not go where the server refused it', async () => {
    answerWith({ error: 'That device is not one of yours.' }, false);

    await expect(sendVideoCommand('theirs', { kind: 'stop' })).resolves.toBe(false);
  });

  it('says a command did not go where the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(sendVideoCommand('tv', { kind: 'resume' })).resolves.toBe(false);
  });
});
