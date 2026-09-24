import { act, renderHook } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValencePhone/music/thePhonesMusicPlayer';
import { useWhereTheSongIs } from './useWhereTheSongIs';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('useWhereTheSongIs', () => {
  it('follows the song as it moves', async () => {
    await act(() => {
      thePhonesMusicPlayer().play([aTrack(1), aTrack(2)], 0);
    });
    const { result } = await renderHook(() => useWhereTheSongIs(), { wrapper: CacheScope });

    await act(() => {
      thePhonesMusicPlayer().seek(30);
    });

    expect(result.current).toBe(30);
  });
});
