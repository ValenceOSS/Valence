import { describe, expect, it, vi } from 'vitest';
import { createLiveTvService } from '@ValenceServer/live/createLiveTvService';
import { aLiveTvStore } from '@ValenceServer/testing/aLiveTvStore';
import { aStoredLiveSource } from '@ValenceServer/testing/aStoredLiveSource';

const AT = new Date('2026-11-04T12:00:00.000Z');

const STREAM = aStoredLiveSource();

describe('createLiveTvService change', () => {
  it('renames a playlist without reading it again', async () => {
    const playlist = aStoredLiveSource({
      kind: 'playlistFile',
      address: null,
      playlist: '#EXTM3U',
    });
    const { store, changes, channels } = aLiveTvStore(playlist);
    const service = createLiveTvService({ store, now: () => AT, fetcher: vi.fn() });

    const changed = await service.change(playlist.id, { name: 'World news' });

    expect(changed).toMatchObject({ id: playlist.id, name: 'World news' });
    expect(changes).toEqual([{ name: 'World news' }]);
    expect(channels).toEqual([]);
  });

  it('renames a single stream’s channel along with it', async () => {
    const { store, channels } = aLiveTvStore(STREAM);
    const service = createLiveTvService({ store, now: () => AT, fetcher: vi.fn() });

    await service.change(STREAM.id, { name: 'World news' });

    expect(channels[0]?.[0]?.name).toBe('World news');
  });

  it('refuses a logo address it cannot read', async () => {
    const { store, changes } = aLiveTvStore(STREAM);
    const service = createLiveTvService({ store, now: () => AT, fetcher: vi.fn() });

    await expect(service.change(STREAM.id, { logoUrl: 'not an address' })).resolves.toMatchObject({
      code: 'error.live.thatAddressCannotBeRead',
    });
    expect(changes).toEqual([]);
  });

  it('reads the channels again from a new address', async () => {
    const { store, changes, channels } = aLiveTvStore(STREAM);
    const service = createLiveTvService({ store, now: () => AT, fetcher: vi.fn() });

    const changed = await service.change(STREAM.id, {
      address: 'https://streams.example/other.m3u8',
    });

    expect(changed).toMatchObject({ address: 'https://streams.example/other.m3u8' });
    expect(changes[0]).toEqual({ address: 'https://streams.example/other.m3u8' });
    expect(channels[0]?.[0]?.streamUrl).toBe('https://streams.example/other.m3u8');
  });

  it('refuses an address it cannot read and changes nothing', async () => {
    const { store, changes } = aLiveTvStore(STREAM);
    const service = createLiveTvService({ store, now: () => AT, fetcher: vi.fn() });

    const changed = await service.change(STREAM.id, { address: 'not an address' });

    expect(changed).toMatchObject({ code: 'error.live.thatAddressCannotBeRead' });
    expect(changes).toEqual([]);
  });

  it('answers nothing for a source it does not hold', async () => {
    const { store } = aLiveTvStore(STREAM);
    const service = createLiveTvService({ store, now: () => AT, fetcher: vi.fn() });

    await expect(
      service.change('6b1f0000-0000-4000-8000-000000000009', { name: 'Gone' }),
    ).resolves.toBeNull();
  });
});
