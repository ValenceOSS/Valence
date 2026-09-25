import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aFakeHeldFiles } from '@ValenceClient/testing/aFakeHeldFiles';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import type { Download } from '@ValenceContracts/schemas/Download';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { LocalNotice } from '@ValenceClient/platform/Platform.types';
import { useFetchWhatThisDeviceAsked } from './useFetchWhatThisDeviceAsked';

const fetchDownloads = vi.fn<() => Promise<Download[]>>();

vi.mock('@ValenceClient/downloads/fetchDownloads', () => ({
  fetchDownloads: () => fetchDownloads(),
}));

const THIS_LAPTOP = 'a-laptop';

const aDownload = (over: Partial<Download> = {}): Download => ({
  id: '00000000-0000-4000-8000-000000000001',
  mediaId: '00000000-0000-4000-8000-000000000002',
  seriesId: null,
  seriesTitle: null,
  title: 'Arrival',
  quality: 'original',
  audioLanguages: [],
  state: 'ready',
  progress: 1,
  bytesPerSecond: null,
  sizeBytes: 100,
  failure: null,
  secondsLeft: null,
  askedFrom: THIS_LAPTOP,
  askedAt: '2026-09-25T00:00:00.000Z',
  readyAt: '2026-09-25T00:10:00.000Z',
  ...over,
});

const aFile = (download: Download, over: Partial<HeldFile> = {}): HeldFile => ({
  downloadId: download.id,
  mediaId: download.mediaId,
  seriesId: null,
  seriesTitle: null,
  title: download.title,
  quality: download.quality,
  durationSeconds: null,
  ofBytes: 100,
  state: 'fetching',
  bytes: 0,
  bytesPerSecond: null,
  failure: null,
  keptAt: '2026-09-25T00:10:00.000Z',
  hasPoster: false,
  ...over,
});

/**
 * A laptop that keeps files, with a store that outlives each render, as a real one does.
 *
 * @param isKeepable - Whether it can keep files at all.
 * @returns The platform and what it was asked to keep and to say.
 */
const aLaptop = (isKeepable = true) => {
  const files = aFakeHeldFiles();
  const notices: LocalNotice[] = [];
  const platform = aFakePlatform({
    thisClientId: () => THIS_LAPTOP,
    canKeepFiles: () => isKeepable,
    held: files.held,
    notifyLocally: (notice) => {
      notices.push(notice);
    },
  });

  installPlatform(platform);

  return { files, notices, platform };
};

beforeEach(() => {
  fetchDownloads.mockReset();
});

afterEach(() => {
  cleanup();
  forgetPlatform();
});

describe('useFetchWhatThisDeviceAsked', () => {
  it('fetches what this device asked for as soon as it is ready, and nothing else', async () => {
    const mine = aDownload();

    fetchDownloads.mockResolvedValue([
      mine,
      aDownload({ id: '00000000-0000-4000-8000-000000000003', askedFrom: 'a-phone' }),
      aDownload({ id: '00000000-0000-4000-8000-000000000004', state: 'preparing' }),
    ]);

    const { files } = aLaptop();

    renderHookInACache(() => {
      useFetchWhatThisDeviceAsked();
    });

    await waitFor(() => {
      expect(files.asked.map((one) => one.downloadId)).toEqual([mine.id]);
    });
  });

  it('never fetches one again once it has started, even after it is let go of', async () => {
    const mine = aDownload();

    fetchDownloads.mockResolvedValue([mine]);

    const { files } = aLaptop();
    const first = renderHookInACache(() => {
      useFetchWhatThisDeviceAsked();
    });

    await waitFor(() => {
      expect(files.asked).toHaveLength(1);
    });
    first.unmount();

    renderHookInACache(() => {
      useFetchWhatThisDeviceAsked();
    });

    await waitFor(() => {
      expect(fetchDownloads).toHaveBeenCalledTimes(2);
    });
    expect(files.asked).toHaveLength(1);
  });

  it('asks nothing of a browser, which keeps nothing', async () => {
    fetchDownloads.mockResolvedValue([aDownload()]);

    const { files } = aLaptop(false);

    renderHookInACache(() => {
      useFetchWhatThisDeviceAsked();
    });

    await act(() => Promise.resolve());

    expect(fetchDownloads).not.toHaveBeenCalled();
    expect(files.asked).toEqual([]);
  });

  it('says so once a file it was fetching has landed', async () => {
    const mine = aDownload();

    fetchDownloads.mockResolvedValue([mine]);

    const { files, notices } = aLaptop();

    renderHookInACache(() => {
      useFetchWhatThisDeviceAsked();
    });

    await waitFor(() => {
      expect(files.asked).toHaveLength(1);
    });

    act(() => {
      files.put([aFile(mine)]);
    });
    act(() => {
      files.put([aFile(mine, { state: 'here', bytes: 100 })]);
    });

    expect(notices).toEqual([
      { title: 'Arrival is on this device', body: 'It is ready to watch offline.' },
    ]);
  });
});
