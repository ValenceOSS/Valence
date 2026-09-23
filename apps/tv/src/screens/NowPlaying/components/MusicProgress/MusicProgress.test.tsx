import { act, fireEvent, render } from '@testing-library/react-native';
import { MusicProgress } from '@ValenceTv/screens/NowPlaying/components/MusicProgress/MusicProgress';

type Heard = (event: { eventType: string }) => void;

const mockRemote = new Set<Heard>();

const mockRing: { isListening: boolean; turn: (degrees: number) => void } = {
  isListening: false,
  turn: () => undefined,
};

jest.mock('react-native/Libraries/Components/TV/TVEventHandler', () => ({
  __esModule: true,
  default: {
    addListener: (heard: Heard) => {
      mockRemote.add(heard);

      return {
        remove: () => {
          mockRemote.delete(heard);
        },
      };
    },
  },
}));

jest.mock('@ValenceTv/remote/useRemoteRing', () => ({
  useRemoteRing: (isListening: boolean, onTurn: (degrees: number) => void) => {
    mockRing.isListening = isListening;
    mockRing.turn = onTurn;
  },
}));

const press = (eventType: string) =>
  act(() => {
    for (const heard of mockRemote) {
      heard({ eventType });
    }
  });

describe('MusicProgress', () => {
  it('shows the time gone and the time left', async () => {
    const drawn = await render(<MusicProgress position={65} duration={200} onSeek={jest.fn()} />);

    expect(drawn.getByText('1:05')).toBeTruthy();
    expect(drawn.getByText('-2:15')).toBeTruthy();
    expect(drawn.getByRole('button', { name: '1:05 of 3:20' })).toBeTruthy();
  });

  it('never shows less than nothing left', async () => {
    const drawn = await render(<MusicProgress position={230} duration={200} onSeek={jest.fn()} />);

    expect(drawn.getByText('-0:00')).toBeTruthy();
  });

  it('ignores left and right until the remote lands on it', async () => {
    const onSeek = jest.fn();

    await render(<MusicProgress position={60} duration={200} onSeek={onSeek} />);
    await press('right');

    expect(onSeek).not.toHaveBeenCalled();
  });

  it('moves ten seconds either way with left and right once the remote is on it', async () => {
    const onSeek = jest.fn();
    const onFocus = jest.fn();
    const drawn = await render(
      <MusicProgress position={60} duration={200} onSeek={onSeek} onFocus={onFocus} />,
    );

    await fireEvent(drawn.getByRole('button', { name: '1:00 of 3:20' }), 'focus');

    expect(onFocus).toHaveBeenCalledTimes(1);

    await press('right');

    expect(onSeek).toHaveBeenLastCalledWith(70);

    await press('left');

    expect(onSeek).toHaveBeenLastCalledWith(50);
  });

  it('stops at the start and the end of the song', async () => {
    const onSeek = jest.fn();
    const early = await render(<MusicProgress position={4} duration={200} onSeek={onSeek} />);

    await fireEvent(early.getByRole('button', { name: '0:04 of 3:20' }), 'focus');
    await press('left');

    expect(onSeek).toHaveBeenLastCalledWith(0);

    await early.unmount();

    const late = await render(<MusicProgress position={195} duration={200} onSeek={onSeek} />);

    await fireEvent(late.getByRole('button', { name: '3:15 of 3:20' }), 'focus');
    await press('right');

    expect(onSeek).toHaveBeenLastCalledWith(200);
  });

  it('does not seek a song whose length is not known yet', async () => {
    const onSeek = jest.fn();
    const drawn = await render(<MusicProgress position={0} duration={0} onSeek={onSeek} />);

    await fireEvent(drawn.getByRole('button', { name: '0:00 of 0:00' }), 'focus');
    await press('right');

    expect(onSeek).not.toHaveBeenCalled();
  });

  it('lets go of the remote when it moves away', async () => {
    const onSeek = jest.fn();
    const drawn = await render(<MusicProgress position={60} duration={200} onSeek={onSeek} />);
    const bar = drawn.getByRole('button', { name: '1:00 of 3:20' });

    await fireEvent(bar, 'focus');
    await fireEvent(bar, 'blur');
    await press('right');

    expect(onSeek).not.toHaveBeenCalled();
    expect(mockRing.isListening).toBe(false);
  });

  it('moves smoothly as a thumb turns round the ring while the remote is on it', async () => {
    const onSeek = jest.fn();
    const drawn = await render(<MusicProgress position={60} duration={200} onSeek={onSeek} />);

    expect(mockRing.isListening).toBe(false);

    await fireEvent(drawn.getByRole('button', { name: '1:00 of 3:20' }), 'focus');

    expect(mockRing.isListening).toBe(true);

    mockRing.turn(90);

    expect(onSeek).toHaveBeenLastCalledWith(75);

    mockRing.turn(-180);

    expect(onSeek).toHaveBeenLastCalledWith(30);
  });

  it('thickens the bar while the remote is on it', async () => {
    const drawn = await render(<MusicProgress position={60} duration={200} onSeek={jest.fn()} />);
    const trackOf = () =>
      drawn.container.queryAll(
        (node) =>
          node.type === 'View' &&
          node.props.style !== undefined &&
          node.children.length === 2 &&
          node.queryAll((inner) => inner.type === 'Text').length === 0,
      )[0];

    expect(trackOf()).toHaveStyle({ height: 8 });

    await fireEvent(drawn.getByRole('button', { name: '1:00 of 3:20' }), 'focus');

    expect(trackOf()).toHaveStyle({ height: 14 });
  });
});
