import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { aFakeCar } from '@ValenceMobile/testing/aFakeCar';
import { useCarPlay } from './useCarPlay';
import type { ReactNode } from 'react';

const mockCar = aFakeCar();

jest.mock('@ValenceMobile/carPlay/theCar', () => ({ theCar: () => mockCar.car }));

/**
 * A cache already holding this profile's music, so nothing is asked of a server.
 *
 * @returns The cache.
 */
const aFullCache = () => {
  const cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

  cache.setQueryData(musicQueries.liked().queryKey, [aTrack(1)]);
  cache.setQueryData(musicQueries.albums('recent').queryKey, []);
  cache.setQueryData(musicQueries.albums('title').queryKey, []);
  cache.setQueryData(musicQueries.playlists().queryKey, []);
  cache.setQueryData(musicQueries.artists().queryKey, []);

  return cache;
};

beforeEach(() => {
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

    expect(mockCar.car.signedOut).toHaveBeenCalledWith(expect.stringContaining('sign in'));
  });
});
