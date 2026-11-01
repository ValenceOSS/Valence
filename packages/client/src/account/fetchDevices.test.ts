import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchDevices, endDevice, endOtherDevices, renameDevice } from './fetchDevices';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<{ ok: boolean; status: number; json: () => Promise<JsonValue> }>;

const fetchMock = vi.fn<FetchLike>();

const ok = (body: JsonValue) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

const device = {
  id: 'session-1',
  name: sayVerbatim('Chrome on macOS'),
  address: '10.0.0.2',
  signedInAt: '2026-08-10T00:00:00.000Z',
  expiresAt: '2026-09-10T00:00:00.000Z',
  isCurrent: true,
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchDevices', () => {
  it('answers with everywhere this account is signed in', async () => {
    fetchMock.mockResolvedValue(ok({ devices: [device] }));

    await expect(fetchDevices()).resolves.toMatchObject([{ name: sayVerbatim('Chrome on macOS') }]);
  });

  it('says so when the server refuses, rather than answering with nothing', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve(null) });

    await expect(fetchDevices()).rejects.toThrow();
  });

  it('says so when the answer is not the shape it was promised', async () => {
    fetchMock.mockResolvedValue(ok({ devices: [{ id: 'session-1' }] }));

    await expect(fetchDevices()).rejects.toThrow();
  });
});

describe('endDevice', () => {
  it('asks for one to be signed out by name', async () => {
    fetchMock.mockResolvedValue(ok(null));

    await expect(endDevice('session-2')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/account/devices/session-2',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('says so when the server did not agree', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve(null) });

    await expect(endDevice('session-2')).resolves.toBe(false);
  });
});

describe('endOtherDevices', () => {
  it('asks for everywhere but here', async () => {
    fetchMock.mockResolvedValue(ok(null));

    await expect(endOtherDevices()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/account/devices/end-others',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('says so when the request never arrived', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(endOtherDevices()).resolves.toBe(false);
  });
});

describe('renameDevice', () => {
  it('asks for the device to be called what its owner chose', async () => {
    fetchMock.mockResolvedValue(ok(null));

    await expect(renameDevice('device-2', 'Living room')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/account/devices/device-2/name',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ name: 'Living room' }) }),
    );
  });

  it('asks for the device’s own name back with nothing', async () => {
    fetchMock.mockResolvedValue(ok(null));

    await expect(renameDevice('device-2', null)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/account/devices/device-2/name',
      expect.objectContaining({ body: JSON.stringify({ name: null }) }),
    );
  });

  it('says so when the server did not agree', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve(null) });

    await expect(renameDevice('device-2', 'Living room')).resolves.toBe(false);
  });

  it('says so when the request never arrived', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(renameDevice('device-2', 'Living room')).resolves.toBe(false);
  });
});
