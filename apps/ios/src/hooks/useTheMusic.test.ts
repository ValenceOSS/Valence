import { act, renderHook } from '@testing-library/react-native';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { useTheMusic } from './useTheMusic';

describe('useTheMusic', () => {
  it('hands over the phone’s one player, and what it is doing as it changes', async () => {
    const { result } = await renderHook(() => useTheMusic());

    expect(result.current.state.queue).toBeNull();

    await act(() => {
      result.current.player.play([aTrack(1), aTrack(2)], 0);
    });

    expect(result.current.state.current?.id).toBe(aTrack(1).id);
  });
});
