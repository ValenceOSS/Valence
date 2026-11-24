import { act, renderHook } from '@testing-library/react-native';
import { useStreamReadings } from '@ValenceTv/playback/useStreamReadings';

const aPlayer = () => ({ currentTime: 0, bufferedPosition: 0, videoTrack: null });

describe('useStreamReadings', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('reads nothing while the statistics are away', async () => {
    const player = aPlayer();
    const { result } = await renderHook(() => useStreamReadings(player, false));

    player.currentTime = 30;

    await act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.history).toEqual([]);
    expect(result.current.reading.positionSeconds).toBe(0);
  });

  it('reads the player at once and then every second, newest last', async () => {
    const player = aPlayer();
    const { result } = await renderHook(() => useStreamReadings(player, true));

    expect(result.current.history).toHaveLength(1);

    player.currentTime = 1;
    player.bufferedPosition = 20;

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.reading).toMatchObject({ positionSeconds: 1, bufferedSeconds: 20 });
  });

  it('keeps only the last minute', async () => {
    const player = aPlayer();
    const { result } = await renderHook(() => useStreamReadings(player, true));

    await act(() => {
      jest.advanceTimersByTime(90_000);
    });

    expect(result.current.history).toHaveLength(60);
  });

  it('forgets what it read once the statistics are put away', async () => {
    const player = aPlayer();
    const { result, rerender } = await renderHook(
      ({ isReading }: { isReading: boolean }) => useStreamReadings(player, isReading),
      { initialProps: { isReading: true } },
    );

    await act(() => {
      jest.advanceTimersByTime(3000);
    });

    await rerender({ isReading: false });

    expect(result.current.history).toEqual([]);
  });
});
