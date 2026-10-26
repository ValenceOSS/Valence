import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { keptListeningOf } from '@ValenceClient/downloads/keptListeningOf';
import { forgetTheKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { aSessionUser } from '@ValenceMobile/testing/aSessionUser';
import { aFakeCar } from '@ValenceMobile/testing/aFakeCar';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { keptAlready } from '@ValenceMobile/testing/keptAlready';
import { useCarPlay } from './useCarPlay';
import type { ReactNode } from 'react';

const mockCar = aFakeCar();

jest.mock('@ValenceMobile/carPlay/theCar', () => ({ theCar: () => mockCar.car }));

/**
 * A cache already holding a signed-in session and its music, so nothing is asked of a server.
 *
 * @param libraries - What kinds of library the server has.
 * @returns The cache.
 */
const aFullCache = (libraries = [aLibrary({ kind: 'music' })]) => {
  const cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

  cache.setQueryData(sessionQueries.who().queryKey, aSessionUser());
  cache.setQueryData(libraryQueries.all().queryKey, libraries);

  cache.setQueryData(musicQueries.liked().queryKey, [aTrack(1)]);
  cache.setQueryData(musicQueries.albums('recent').queryKey, []);
  cache.setQueryData(musicQueries.albums('title').queryKey, []);
  cache.setQueryData(musicQueries.playlists().queryKey, []);
  cache.setQueryData(musicQueries.artists().queryKey, []);

  return cache;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCar.car.isConnected.mockReturnValue(true);
  forgetTheKeptListening();
  installPlatform(aFakePlatform({ serverAddress: () => 'http://valence.test' }));
});

describe('useCarPlay', () => {
  it('fills the car, plays what is chosen in it, and says so once nobody is signed in', async () => {
    const cache = aFullCache();
    const { unmount } = await renderHook(() => useCarPlay(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={cache}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(mockCar.car.setShelves).toHaveBeenCalled();
    });

    mockCar.choose({ id: 'liked' });
    mockCar.choose({ nothing: true });

    await waitFor(() => {
      expect(mockCar.car.showNowPlaying).toHaveBeenCalledTimes(1);
    });

    await unmount();

    expect(mockCar.car.showMessage).toHaveBeenCalledWith(expect.stringContaining('sign in'));
  });

  it('says the server has no music library, rather than showing empty tabs, where it has none', async () => {
    const cache = aFullCache([aLibrary({ kind: 'movies' })]);

    await renderHook(() => useCarPlay(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={cache}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(mockCar.car.showMessage).toHaveBeenCalledWith(
        'This server has no music library set up.',
      );
    });

    expect(mockCar.car.setShelves).not.toHaveBeenCalled();
  });

  it('asks the server for nothing until a car is connected', async () => {
    const asked = jest.fn(() => Promise.resolve(Response.json({})));
    const cache = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });

    global.fetch = asked;
    cache.setQueryData(sessionQueries.who().queryKey, aSessionUser());
    mockCar.car.isConnected.mockReturnValue(false);

    await renderHook(() => useCarPlay(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={cache}>{children}</QueryClientProvider>
      ),
    });

    expect(asked).not.toHaveBeenCalled();

    mockCar.connect(true);

    await waitFor(() => {
      expect(asked).toHaveBeenCalled();
    });
  });

  it('puts the music the phone keeps first, pictured by the cover it keeps beside it', async () => {
    const cache = aFullCache();
    const platform = aFakePlatform({
      serverAddress: () => 'http://valence.test',
      listeningFiles: aFakeListeningFiles().files,
    });

    installPlatform(platform);
    keptAlready(platform.store, [
      keptListeningOf({
        kind: 'album',
        detail: { album: anAlbum({ hasArtwork: true }), tracks: [aTrack(1)] },
        quality: 'high',
      }),
    ]);

    await renderHook(() => useCarPlay(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={cache}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(mockCar.car.setShelves).toHaveBeenCalled();
    });

    const [downloaded] = mockCar.car.setShelves.mock.calls.at(-1)?.[0] ?? [];

    expect(downloaded?.title).toBe('Downloaded');
    expect(downloaded?.sections[0]?.rows[0]).toMatchObject({
      id: `kept:album:${anAlbum().id}`,
      artwork: `file:///kept/artwork-album-${anAlbum().id}.jpg`,
    });
  });
});
