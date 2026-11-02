import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aFakeHeldFiles } from '@ValenceClient/testing/aFakeHeldFiles';
import { chooseDeviceNotices } from '@ValenceClient/notifications/deviceNotices';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { aViewerProfile } from '@ValenceClient/testing/aViewerProfile';
import type { Download } from '@ValenceContracts/schemas/Download';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { LocalNotice } from '@ValenceClient/platform/Platform.types';
import { useFetchWhatThisDeviceAsked } from './useFetchWhatThisDeviceAsked';

const fetchDownloads = vi.fn<() => Promise<Download[]>>();
const fetchProfileList = vi.fn(() =>
  Promise.resolve({ profiles: [aViewerProfile({ id: DAN })], chosenProfileId: DAN }),
);

vi.mock('@ValenceClient/downloads/fetchDownloads', () => ({
  fetchDownloads: () => fetchDownloads(),
}));

vi.mock('@ValenceClient/profiles/fetchProfileList', () => ({
  fetchProfileList: () => fetchProfileList(),
}));

const DAN = '00000000-0000-4000-8000-0000000000d1';

const KID = '00000000-0000-4000-8000-0000000000c1';

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
  hasTrickplay: false,
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
  fetchProfileList.mockResolvedValue({
    profiles: [aViewerProfile({ id: DAN })],
    chosenProfileId: DAN,
  });
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

  it('does not fetch again what one profile let go of after another watched here', async () => {
    const mine = aDownload();

    fetchDownloads.mockResolvedValue([mine]);

    const { files } = aLaptop();
    const asDan = renderHookInACache(() => {
      useFetchWhatThisDeviceAsked();
    });

    await waitFor(() => {
      expect(files.asked).toHaveLength(1);
    });
    asDan.unmount();
    fetchDownloads.mockResolvedValue([]);
    fetchProfileList.mockResolvedValue({
      profiles: [aViewerProfile({ id: KID })],
      chosenProfileId: KID,
    });

    const asKid = renderHookInACache(() => {
      useFetchWhatThisDeviceAsked();
    });

    await waitFor(() => {
      expect(fetchDownloads).toHaveBeenCalledTimes(2);
    });
    asKid.unmount();
    fetchDownloads.mockResolvedValue([mine]);
    fetchProfileList.mockResolvedValue({
      profiles: [aViewerProfile({ id: DAN })],
      chosenProfileId: DAN,
    });
    renderHookInACache(() => {
      useFetchWhatThisDeviceAsked();
    });

    await waitFor(() => {
      expect(fetchDownloads).toHaveBeenCalledTimes(3);
    });
    expect(files.asked).toHaveLength(1);
  });

  it('does not check the downloads of the profile before against the list of the next', async () => {
    const mine = aDownload();

    fetchDownloads.mockResolvedValue([mine]);

    const { files } = aLaptop();
    const cache = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: cache }, children);

    renderHook(
      () => {
        useFetchWhatThisDeviceAsked();
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(files.asked).toHaveLength(1);
    });

    act(() => {
      void files.held.drop(mine.id);
    });
    fetchProfileList.mockResolvedValue({
      profiles: [aViewerProfile({ id: KID })],
      chosenProfileId: KID,
    });

    await act(async () => {
      await cache.invalidateQueries({ queryKey: ['profiles'] });
    });
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
    });

    expect(cache.getQueryData(['profiles', 'watching'])).toMatchObject({ id: KID });
    expect(fetchDownloads).toHaveBeenCalledTimes(1);
    expect(files.asked).toHaveLength(1);
  });

  it('remembers what was fetched before each profile kept its own list', async () => {
    const mine = aDownload();

    fetchDownloads.mockResolvedValue([mine]);

    const { files, platform } = aLaptop();

    platform.store.write('valence.downloads.startedHere', JSON.stringify([mine.id]));
    renderHookInACache(() => {
      useFetchWhatThisDeviceAsked();
    });

    await waitFor(() => {
      expect(fetchDownloads).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(platform.store.read(`valence.downloads.startedHere.${DAN}`)).not.toBeNull();
    });
    expect(files.asked).toEqual([]);
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

  it('says so once a file it was fetching has landed, where notices are on', async () => {
    const mine = aDownload();

    fetchDownloads.mockResolvedValue([mine]);

    const { files, notices } = aLaptop();

    chooseDeviceNotices(true);

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
      { title: 'Arrival has finished downloading', body: 'It’s ready to watch offline.' },
    ]);
  });

  it('says nothing when a file lands where notices are off', async () => {
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

    expect(notices).toEqual([]);
  });
});
