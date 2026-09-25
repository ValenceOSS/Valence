import { act, renderHook } from '@testing-library/react-native';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { useTheMusic } from './useTheMusic';

describe('useTheMusic', () => {
  it('hands over the phone’s one player, and what it is doing as it changes', async () => {
    thePhonesMusicPlayer().stop();
    const { result } = await renderHook(() => useTheMusic());

    expect(result.current.state.queue).toBeNull();

    await act(() => {
      result.current.player.play([aTrack(1), aTrack(2)], 0);
    });

    expect(result.current.state.current?.id).toBe(aTrack(1).id);
  });

  it('leaves the song’s position alone unless asked to follow it', async () => {
    await act(() => {
      thePhonesMusicPlayer().play([aTrack(1), aTrack(2)], 0);
    });
    const still = await renderHook(() => useTheMusic());
    const following = await renderHook(() => useTheMusic({ followsPosition: true }));

    await act(() => {
      thePhonesMusicPlayer().seek(42);
    });

    expect(still.result.current.state.positionSeconds).toBe(0);
    expect(following.result.current.state.positionSeconds).toBe(42);
  });
});
