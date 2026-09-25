import { renderHook } from '@testing-library/react-native';
import { useVideoPlayer } from 'expo-video';
import { setThePace } from './setThePace';

describe('setThePace', () => {
  it('plays faster or slower, as asked', async () => {
    const { result } = await renderHook(() => useVideoPlayer(null));

    setThePace(result.current, 1.5);

    expect(result.current.playbackRate).toBe(1.5);
  });
});
