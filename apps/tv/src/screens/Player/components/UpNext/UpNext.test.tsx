import { act, render, userEvent } from '@testing-library/react-native';
import { UpNext } from '@ValenceTv/screens/Player/components/UpNext/UpNext';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const EPISODE: MediaSummary = {
  id: '00000000-0000-4000-8000-000000000002',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: 'The Hunt',
  year: 2024,
  durationSeconds: 3000,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: 'show-1',
  seasonNumber: 2,
  episodeNumber: 5,
};

const aSecondPasses = async (times: number) => {
  for (let second = 0; second < times; second += 1) {
    await act(() => {
      jest.advanceTimersByTime(1000);
    });
  }
};

describe('UpNext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('says what comes next, with its place and name', async () => {
    const drawn = await render(
      <UpNext episode={EPISODE} isAsking={false} onPlay={jest.fn()} onStay={jest.fn()} />,
    );

    expect(drawn.getByText('Up next')).toBeTruthy();
    expect(drawn.getByText('S2: E5 · The Hunt')).toBeTruthy();
  });

  it('leaves out the place of something not numbered', async () => {
    const drawn = await render(
      <UpNext
        episode={{ ...EPISODE, seasonNumber: null, episodeNumber: null }}
        isAsking={false}
        onPlay={jest.fn()}
        onStay={jest.fn()}
      />,
    );

    expect(drawn.getByText('The Hunt')).toBeTruthy();
  });

  it('counts down from ten and starts it at the end of the count', async () => {
    const onPlay = jest.fn();
    const drawn = await render(
      <UpNext episode={EPISODE} isAsking={false} onPlay={onPlay} onStay={jest.fn()} />,
    );

    expect(drawn.getByRole('button', { name: 'Play in 10' })).toBeTruthy();

    await aSecondPasses(3);

    expect(drawn.getByRole('button', { name: 'Play in 7' })).toBeTruthy();
    expect(onPlay).not.toHaveBeenCalled();

    await aSecondPasses(7);

    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('starts it at once when the button is pressed', async () => {
    const onPlay = jest.fn();
    const drawn = await render(
      <UpNext episode={EPISODE} isAsking={false} onPlay={onPlay} onStay={jest.fn()} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Play in 10' }));

    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('asks whether anybody is still there rather than counting', async () => {
    const onPlay = jest.fn();
    const drawn = await render(
      <UpNext episode={EPISODE} isAsking onPlay={onPlay} onStay={jest.fn()} />,
    );

    expect(drawn.getByText('Are you still watching?')).toBeTruthy();

    await aSecondPasses(20);

    expect(onPlay).not.toHaveBeenCalled();

    await userEvent.press(drawn.getByRole('button', { name: 'Keep watching' }));

    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('stays with the credits when asked to', async () => {
    const onStay = jest.fn();
    const drawn = await render(
      <UpNext episode={EPISODE} isAsking={false} onPlay={jest.fn()} onStay={onStay} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Stay' }));

    expect(onStay).toHaveBeenCalledTimes(1);
  });
});
