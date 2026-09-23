import { act, fireEvent, render, userEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { LyricLines } from '@ValenceTv/screens/NowPlaying/components/LyricLines/LyricLines';
import type { Lyrics } from '@ValenceContracts/schemas/Music';

const SONG: Lyrics = {
  isSynced: true,
  lines: [
    { atMs: 6000, text: 'First light' },
    { atMs: 9000, text: 'Second wind' },
    { atMs: 12_000, text: '' },
    { atMs: 24_000, text: 'Third time' },
    { atMs: 25_000, text: '' },
    { atMs: 26_000, text: 'Fourth wall' },
  ],
};

const layoutOf = (y: number, height: number) => ({
  nativeEvent: { layout: { x: 0, y, width: 900, height } },
});

const drawAt = (positionMs: number, lyrics: Lyrics = SONG, onSeek = jest.fn()) =>
  render(<LyricLines lyrics={lyrics} positionMs={positionMs} onSeek={onSeek} />);

type Drawn = Awaited<ReturnType<typeof drawAt>>;

const dotsIn = (drawn: Drawn) =>
  drawn.container.queryAll((node) => node.type === 'View' && node.children.length === 0);

const rowsIn = (drawn: Drawn) =>
  drawn.container.queryAll(
    (node) =>
      node.type === 'View' &&
      node.props.collapsable === false &&
      typeof node.props.onLayout === 'function',
  );

const gapsIn = (drawn: Drawn) =>
  rowsIn(drawn).filter((row) => row.queryAll((inner) => inner.type === 'Text').length === 0);

describe('LyricLines', () => {
  it('draws every line with words, in order', async () => {
    const drawn = await drawAt(0);

    expect(drawn.getAllByRole('button')).toEqual(
      ['First light', 'Second wind', 'Third time', 'Fourth wall'].map((name) =>
        drawn.getByRole('button', { name }),
      ),
    );
  });

  it('stands dots in for the wait before the first line and for a long empty line, and leaves out a short one', async () => {
    const drawn = await drawAt(0);

    expect(gapsIn(drawn)).toHaveLength(2);
    expect(dotsIn(drawn)).toHaveLength(6);
  });

  it('draws no dots before a first line that comes almost at once', async () => {
    const drawn = await drawAt(0, {
      isSynced: true,
      lines: [
        { atMs: 1000, text: 'Straight in' },
        { atMs: 3000, text: 'And on' },
      ],
    });

    expect(dotsIn(drawn)).toHaveLength(0);
  });

  it('lights the line being sung and dims those either side of it', async () => {
    const drawn = await drawAt(10_000);

    expect(drawn.getByText('Second wind')).toHaveStyle({ opacity: 1 });
    expect(drawn.getByText('First light')).toHaveStyle({ opacity: 0.4 });
    expect(drawn.getByText('Third time')).toHaveStyle({ opacity: 0.52 });
    expect(drawn.getByText('Fourth wall')).toHaveStyle({ opacity: 0.42 });
  });

  it('moves the light on to the next line once its time comes', async () => {
    const drawn = await drawAt(24_500);

    expect(drawn.getByText('Third time')).toHaveStyle({ opacity: 1 });
    expect(drawn.getByText('Second wind')).toHaveStyle({ opacity: 0.30000000000000004 });
  });

  it('fills the dots of the gap being waited through and quietens the others', async () => {
    const drawn = await drawAt(16_000);
    const [before, during] = gapsIn(drawn);

    expect(before).toHaveStyle({ opacity: 0.4 });
    expect(during).not.toHaveStyle({ opacity: 0.4 });

    const [, , , first, second] = dotsIn(drawn);

    expect(first).toHaveStyle({ opacity: 1 });
    expect(second).toHaveStyle({ opacity: 0.3 });
  });

  it('fills the opening dots as the song reaches its first line', async () => {
    const drawn = await drawAt(2000);
    const [first, second] = dotsIn(drawn);

    expect(first).toHaveStyle({ opacity: 1 });
    expect(second).toHaveStyle({ opacity: 0.3 });
  });

  it('shows words that are not timed whole, with none lit above another', async () => {
    const drawn = await drawAt(50_000, {
      isSynced: false,
      lines: [
        { atMs: null, text: 'Loose words' },
        { atMs: null, text: 'Without a clock' },
      ],
    });

    expect(drawn.getByText('Loose words')).toHaveStyle({ opacity: 1 });
    expect(drawn.getByText('Without a clock')).toHaveStyle({ opacity: 1 });
  });

  it('goes to where a line is sung when it is pressed', async () => {
    const onSeek = jest.fn();
    const drawn = await drawAt(0, SONG, onSeek);

    await userEvent.press(drawn.getByRole('button', { name: 'Third time' }));

    expect(onSeek).toHaveBeenCalledWith(24);
  });

  it('does not seek when an untimed line is pressed', async () => {
    const onSeek = jest.fn();
    const drawn = await drawAt(
      0,
      { isSynced: false, lines: [{ atMs: null, text: 'Loose words' }] },
      onSeek,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Loose words' }));

    expect(onSeek).not.toHaveBeenCalled();
  });

  it('glides the column so the sung line sits a third of the way down', async () => {
    const glides = jest.spyOn(Animated, 'spring');
    const drawn = await drawAt(10_000);
    const [room] = drawn.container.queryAll(
      (node) =>
        node.type === 'View' &&
        typeof node.props.onLayout === 'function' &&
        node.props.collapsable !== false,
    );

    if (room === undefined) {
      throw new Error('The room was not drawn.');
    }

    await fireEvent(room, 'layout', layoutOf(0, 1000));

    const lines = rowsIn(drawn);

    for (const [at, line] of lines.entries()) {
      await fireEvent(line, 'layout', layoutOf(at * 100, 80));
    }

    expect(glides).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: -(200 + 40 - 320) }),
    );

    glides.mockRestore();
  });

  it('follows the remote rather than the song while it steps through the lines, then the song again', async () => {
    jest.useFakeTimers();

    const glides = jest.spyOn(Animated, 'spring');
    const drawn = await drawAt(10_000);
    const [room] = drawn.container.queryAll(
      (node) =>
        node.type === 'View' &&
        typeof node.props.onLayout === 'function' &&
        node.props.collapsable !== false,
    );

    if (room === undefined) {
      throw new Error('The room was not drawn.');
    }

    await fireEvent(room, 'layout', layoutOf(0, 1000));

    const lines = rowsIn(drawn);

    for (const [at, line] of lines.entries()) {
      await fireEvent(line, 'layout', layoutOf(at * 100, 80));
    }

    await fireEvent(drawn.getByRole('button', { name: 'Fourth wall' }), 'focus');

    expect(glides).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: -(500 + 40 - 320) }),
    );

    await act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(glides).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: -(200 + 40 - 320) }),
    );

    glides.mockRestore();
    jest.useRealTimers();
  });
});
