import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { fetchMusicDevices, reportNowPlaying, sendMusicCommand } from './musicDevices';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

const answerWith = (body: JsonValue, ok = true) => {
  fetchMock.mockResolvedValue({ ok, status: ok ? 200 : 404, json: () => Promise.resolve(body) });
};

beforeEach(() => {
  installPlatform(aFakePlatform({ thisClientId: () => 'this-tab' }));
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('musicDevices', () => {
  it('reads the devices this profile has open', async () => {
    answerWith({ devices: [{ clientId: 'phone', label: 'iPhone', nowPlaying: null }] });

    await expect(fetchMusicDevices()).resolves.toEqual([
      { clientId: 'phone', label: 'iPhone', nowPlaying: null },
    ]);
  });

  it('reports what this device is playing, as this device', async () => {
    answerWith({ ok: true });

    await reportNowPlaying(null);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/music/devices/now-playing',
      expect.objectContaining({ body: JSON.stringify({ clientId: 'this-tab', nowPlaying: null }) }),
    );
  });

  it('sends a command to another device, saying where it came from', async () => {
    answerWith({ ok: true });

    await expect(sendMusicCommand('phone', { kind: 'pause' })).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/music/devices/phone/command',
      expect.objectContaining({
        body: JSON.stringify({ fromClientId: 'this-tab', command: { kind: 'pause' } }),
      }),
    );
  });

  it('says a command did not go where the server refused it', async () => {
    answerWith({ error: 'That device is not one of yours.' }, false);

    await expect(sendMusicCommand('theirs', { kind: 'pause' })).resolves.toBe(false);
  });
});
