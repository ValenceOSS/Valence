import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as CastSenderModule from '@ValenceScreens/playback/castSender';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import type { Casting } from '@ValenceClient/platform/Platform.types';
import { findACaster } from './findACaster';

const loadCastSenderMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceScreens/playback/castSender', async () => ({
  ...(await vi.importActual<typeof CastSenderModule>('@ValenceScreens/playback/castSender')),
  loadCastSender: loadCastSenderMock,
}));

const aClientThatCasts = (): Casting => ({
  now: () => ({ state: 'unavailable', devices: [], device: null }),
  whenChanged: () => () => undefined,
  connect: () => Promise.resolve(false),
  disconnect: () => Promise.resolve(),
  load: () => Promise.resolve(false),
  whenPlayed: () => () => undefined,
  play: vi.fn(),
  pause: vi.fn(),
  seek: vi.fn(),
  setVolume: vi.fn(),
  reachableAddress: () => Promise.resolve(null),
});

afterEach(() => {
  loadCastSenderMock.mockReset();
  installATestClient();
});

describe('findACaster', () => {
  it('casts through the client where it offers casting, without loading the browser’s SDK', async () => {
    installATestClient({ casting: aClientThatCasts() });

    const caster = await findACaster();

    expect(caster?.canReach('http://127.0.0.1:41847')).toBe(true);
    expect(loadCastSenderMock).not.toHaveBeenCalled();
  });

  it('casts through the browser’s SDK where the client offers nothing', async () => {
    installATestClient();
    loadCastSenderMock.mockResolvedValue({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      requestSession: vi.fn(() => Promise.resolve()),
    });

    const caster = await findACaster();

    expect(caster?.canReach('http://localhost:8420')).toBe(false);
  });

  it('has nothing to cast with where the browser has no SDK', async () => {
    installATestClient();
    loadCastSenderMock.mockResolvedValue(null);

    await expect(findACaster()).resolves.toBeNull();
  });
});
