import { describe, expect, it, vi } from 'vitest';
import { createLiveTvService } from '@ValenceServer/live/createLiveTvService';
import { aLiveTvStore } from '@ValenceServer/testing/aLiveTvStore';
import { aStoredLiveSource } from '@ValenceServer/testing/aStoredLiveSource';

const AT = new Date('2026-11-04T12:00:00.000Z');

const STREAM = aStoredLiveSource();

describe('createLiveTvService isFromThePublicInternet', () => {
  const aChannelOf = (sourceId: string) => ({
    number: null,
    name: 'News',
    group: null,
    logoUrl: null,
    guideId: null,
    streamUrl: 'http://192.168.1.20/news.ts',
    userAgent: null,
    referrer: null,
    id: 'news',
    sourceId,
    position: 0,
    health: null,
    route: null,
    checkedAt: null,
  });

  it('says a channel from a playlist on the public internet is', async () => {
    const playlist = aStoredLiveSource({ kind: 'playlistUrl', address: 'https://8.8.8.8/tv.m3u' });
    const { store } = aLiveTvStore(playlist);
    const service = createLiveTvService({ store, now: () => AT, fetcher: vi.fn() });

    expect(await service.isFromThePublicInternet(aChannelOf(playlist.id))).toBe(true);
  });

  it('keeps the guard on when the name does not resolve, or answers both ways', async () => {
    const playlist = aStoredLiveSource({
      kind: 'playlistUrl',
      address: 'http://nowhere.example/tv.m3u',
    });
    const { store } = aLiveTvStore(playlist);
    const failing = createLiveTvService({
      store,
      now: () => AT,
      fetcher: vi.fn(),
      resolve: () => Promise.reject(new Error('ENOTFOUND')),
    });
    const mixed = createLiveTvService({
      store,
      now: () => AT,
      fetcher: vi.fn(),
      resolve: () => Promise.resolve(['8.8.8.8', '192.168.1.5']),
    });
    const local = createLiveTvService({
      store,
      now: () => AT,
      fetcher: vi.fn(),
      resolve: () => Promise.resolve(['192.168.1.5']),
    });

    expect(await failing.isFromThePublicInternet(aChannelOf(playlist.id))).toBe(true);
    expect(await mixed.isFromThePublicInternet(aChannelOf(playlist.id))).toBe(true);
    expect(await local.isFromThePublicInternet(aChannelOf(playlist.id))).toBe(false);
  });

  it('remembers the verdict until the source is refreshed', async () => {
    const playlist = aStoredLiveSource({
      kind: 'playlistUrl',
      address: 'http://tv.example/tv.m3u',
    });
    const { store } = aLiveTvStore(playlist);
    const resolve = vi.fn(() => Promise.resolve(['8.8.8.8']));
    const service = createLiveTvService({ store, now: () => AT, fetcher: vi.fn(), resolve });

    await service.isFromThePublicInternet(aChannelOf(playlist.id));
    await service.isFromThePublicInternet(aChannelOf(playlist.id));

    expect(resolve).toHaveBeenCalledTimes(1);

    await service.refresh(playlist.id);
    await service.isFromThePublicInternet(aChannelOf(playlist.id));

    expect(resolve).toHaveBeenCalledTimes(2);
  });

  it('says a channel from this network, or one the administrator gave, is not', async () => {
    for (const source of [
      aStoredLiveSource({ kind: 'playlistUrl', address: 'http://192.168.1.20/tv.m3u' }),
      aStoredLiveSource({ kind: 'tuner', address: 'http://192.168.1.30' }),
      aStoredLiveSource({ kind: 'playlistFile', address: null, playlist: '#EXTM3U' }),
      aStoredLiveSource({ kind: 'stream', address: 'https://8.8.8.8/one.m3u8' }),
    ]) {
      const { store } = aLiveTvStore(source);
      const service = createLiveTvService({ store, now: () => AT, fetcher: vi.fn() });

      expect(await service.isFromThePublicInternet(aChannelOf(source.id)), source.kind).toBe(false);
    }
  });
});

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
