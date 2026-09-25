import { renderHook } from '@testing-library/react-native';
import { useVideoPlayer } from 'expo-video';
import { hushThePlayer } from './hushThePlayer';

describe('hushThePlayer', () => {
  it('mutes the player and brings its sound back', async () => {
    const { result } = await renderHook(() => useVideoPlayer(null));

    hushThePlayer(result.current, true);
    expect(result.current.muted).toBe(true);

    hushThePlayer(result.current, false);
    expect(result.current.muted).toBe(false);
  });
});
