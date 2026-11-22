import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { soundtrackToAsk } from './soundtrackToAsk';
import type * as FetchLibrary from '@ValenceClient/library/fetchLibrary';

const fetchMediaDetail = vi.hoisted(() => vi.fn());
const fetchServerBuildInfo = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/fetchLibrary', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchLibrary>()),
  fetchMediaDetail,
}));

vi.mock('@ValenceClient/about/fetchServerBuildInfo', () => ({ fetchServerBuildInfo }));

const aCache = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

const EPISODE = {
  id: 'episode-2',
  audioStreams: [
    { index: 1, codec: 'aac', channels: 2, isDefault: true, isAtmos: false, language: 'jpn' },
    { index: 2, codec: 'aac', channels: 2, isDefault: false, isAtmos: false, language: 'eng' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  fetchMediaDetail.mockResolvedValue(EPISODE);
  fetchServerBuildInfo.mockResolvedValue({ features: ['playback.audioLanguage'] });
});

describe('soundtrackToAsk', () => {
  it('asks a server that picks by language for the language remembered', async () => {
    await expect(soundtrackToAsk(aCache(), 'episode-2', 'jpn')).resolves.toEqual({
      audioStreamIndex: undefined,
      audioLanguage: 'ja',
    });
    expect(fetchMediaDetail).toHaveBeenCalledWith('episode-2');
  });

  it('asks an older server for the track in it', async () => {
    fetchServerBuildInfo.mockResolvedValue({ features: [] });

    await expect(soundtrackToAsk(aCache(), 'episode-2', 'ja')).resolves.toEqual({
      audioStreamIndex: 1,
      audioLanguage: undefined,
    });
  });

  it('treats a server that cannot say what it has as an older one', async () => {
    fetchServerBuildInfo.mockRejectedValue(new Error('offline'));

    await expect(soundtrackToAsk(aCache(), 'episode-2', 'jpn')).resolves.toMatchObject({
      audioStreamIndex: 1,
    });
  });

  it('still asks a server that picks by language for it where the title cannot be read', async () => {
    fetchMediaDetail.mockRejectedValue(new Error('offline'));

    await expect(soundtrackToAsk(aCache(), 'episode-2', 'jpn')).resolves.toEqual({
      audioStreamIndex: undefined,
      audioLanguage: 'ja',
    });
  });

  it('asks an older server for nothing where the title cannot be read', async () => {
    fetchMediaDetail.mockRejectedValue(new Error('offline'));
    fetchServerBuildInfo.mockResolvedValue({ features: [] });

    await expect(soundtrackToAsk(aCache(), 'episode-2', 'jpn')).resolves.toEqual({
      audioStreamIndex: undefined,
      audioLanguage: undefined,
    });
  });

  it('reads nothing where nothing was remembered', async () => {
    await expect(soundtrackToAsk(aCache(), 'episode-2', null)).resolves.toEqual({
      audioStreamIndex: undefined,
      audioLanguage: undefined,
    });
    expect(fetchMediaDetail).not.toHaveBeenCalled();
    expect(fetchServerBuildInfo).not.toHaveBeenCalled();
  });
});
