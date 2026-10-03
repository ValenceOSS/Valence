import { describe, expect, it, vi } from 'vitest';
import { aDeviceProfile } from '@ValenceServer/testing/aDeviceProfile';
import { createLinkedDownloads } from './createLinkedDownloads';
import type { DownloadOffer, DownloadService } from '@ValenceServer/downloads/DownloadService';

const DEVICE = aDeviceProfile();

const option = (quality: 'original' | '720p') => ({
  quality,
  label: quality,
  meaning: quality,
  bytes: null,
  comparison: null,
  wouldTranscode: quality !== 'original',
  savesSpace: quality !== 'original',
});

const OFFER: DownloadOffer = {
  mediaId: 'm',
  title: 'Arrival',
  episodes: 1,
  options: [option('original'), option('720p')],
};

/**
 * This server's own downloads, offering an original and a smaller copy of anything.
 *
 * @returns The downloads.
 */
const aLocal = () => ({
  offer: vi.fn<DownloadService['offer']>(() => Promise.resolve(OFFER)),
  offerSeries: vi.fn<DownloadService['offerSeries']>(() => Promise.resolve(OFFER)),
  ask: vi.fn<DownloadService['ask']>(() => Promise.resolve(null)),
  askForSeries: vi.fn<DownloadService['askForSeries']>(() => Promise.resolve([])),
  pause: vi.fn<DownloadService['pause']>(() => Promise.resolve()),
  resume: vi.fn<DownloadService['resume']>(() => Promise.resolve()),
  list: vi.fn<DownloadService['list']>(() => Promise.resolve([])),
  find: vi.fn<DownloadService['find']>(() => Promise.resolve(null)),
  follow: vi.fn<DownloadService['follow']>(() => Promise.resolve([])),
  forget: vi.fn<DownloadService['forget']>(() => Promise.resolve()),
  clearOutBefore: vi.fn<DownloadService['clearOutBefore']>(() => Promise.resolve(0)),
  readFile: vi.fn<DownloadService['readFile']>(() => Promise.resolve(null)),
  hold: vi.fn<DownloadService['hold']>(() => Promise.resolve()),
  release: vi.fn<DownloadService['release']>(() => Promise.resolve()),
  held: vi.fn<DownloadService['held']>(() => Promise.resolve([])),
});

/**
 * The gate over this server's downloads, where `theirs` and `their-show` come from Films.
 *
 * @param allows - Whether Films lets this server's people keep its titles.
 * @returns The gate, and the downloads under it.
 */
const gated = (allows: boolean) => {
  const local = aLocal();
  const downloads = createLinkedDownloads(
    local,
    (mediaId) =>
      Promise.resolve(mediaId === 'theirs' ? { serverId: 'films', remoteId: 'r' } : null),
    (seriesId) => Promise.resolve(seriesId === 'their-show' ? 'films' : null),
    () => allows,
  );

  return { downloads, local };
};

describe('createLinkedDownloads', () => {
  it('offers and keeps this server’s own titles and programmes as it always has', async () => {
    const { downloads, local } = gated(false);

    expect(await downloads.offer('mine', DEVICE)).toEqual(OFFER);
    expect(await downloads.offerSeries('my-show', DEVICE)).toEqual(OFFER);

    await downloads.ask('p', null, 'mine', '720p', []);
    await downloads.askForSeries('p', null, 'my-show', '720p', []);

    expect(local.ask).toHaveBeenCalledOnce();
    expect(local.askForSeries).toHaveBeenCalledOnce();
  });

  it('offers nothing from a linked server that keeps its titles to itself', async () => {
    const { downloads, local } = gated(false);

    expect(await downloads.offer('theirs', DEVICE)).toBeNull();
    expect(await downloads.offerSeries('their-show', DEVICE)).toBeNull();
    expect(await downloads.ask('p', null, 'theirs', 'original', [])).toBeNull();
    expect(await downloads.askForSeries('p', null, 'their-show', 'original', [])).toEqual([]);
    expect(local.ask).not.toHaveBeenCalled();
    expect(local.askForSeries).not.toHaveBeenCalled();
  });

  it('offers and keeps only the original from a linked server that lets them', async () => {
    const { downloads, local } = gated(true);

    expect((await downloads.offer('theirs', DEVICE))?.options).toEqual([option('original')]);
    expect((await downloads.offerSeries('their-show', DEVICE))?.options).toEqual([
      option('original'),
    ]);
    expect(await downloads.ask('p', null, 'theirs', '720p', [])).toBeNull();
    expect(await downloads.askForSeries('p', null, 'their-show', '720p', [])).toEqual([]);

    await downloads.ask('p', null, 'theirs', 'original', []);
    await downloads.askForSeries('p', null, 'their-show', 'original', []);

    expect(local.ask).toHaveBeenCalledOnce();
    expect(local.askForSeries).toHaveBeenCalledOnce();
  });
});
