import { act, render } from '@testing-library/react-native';
import { PlayingBars } from '@ValenceTv/components/PlayingBars/PlayingBars';

const mockListeners = new Set<(frames: readonly number[]) => void>();

jest.mock('@ValenceTv/music/listenToTheSound', () => ({
  listenToTheSound: (listener: (frames: readonly number[]) => void) => {
    mockListeners.add(listener);

    return () => {
      mockListeners.delete(listener);
    };
  },
}));

type Drawn = Awaited<ReturnType<typeof render>>;

const barsOf = (drawn: Drawn) =>
  drawn.root?.children.flatMap((bar) => (typeof bar === 'string' ? [] : [bar])) ?? [];

const aHum = (): number[] =>
  Array.from({ length: 1024 }, (_, at) => Math.sin((2 * Math.PI * 3 * at) / 1024));

describe('PlayingBars', () => {
  beforeEach(() => {
    mockListeners.clear();
  });

  it('stands four bars together at the size it is given', async () => {
    const drawn = await render(<PlayingBars isPlaying={false} colour="#ffffff" size={28} />);

    expect(barsOf(drawn)).toHaveLength(4);
    expect(drawn.root).toHaveStyle({ width: 28, height: 28 });
    barsOf(drawn).forEach((bar) => {
      expect(bar).toHaveStyle({ backgroundColor: '#ffffff', width: 4 });
    });
  });

  it('listens to the music only while it plays', async () => {
    const drawn = await render(<PlayingBars isPlaying={false} colour="#ffffff" />);

    expect(mockListeners.size).toBe(0);

    await drawn.rerender(<PlayingBars isPlaying colour="#ffffff" />);

    expect(mockListeners.size).toBe(1);

    await drawn.rerender(<PlayingBars isPlaying={false} colour="#ffffff" />);

    expect(mockListeners.size).toBe(0);
  });

  it('stops listening once it is gone', async () => {
    const drawn = await render(<PlayingBars isPlaying colour="#ffffff" />);

    await drawn.unmount();

    expect(mockListeners.size).toBe(0);
  });

  it('rises with the music it hears', async () => {
    const drawn = await render(<PlayingBars isPlaying colour="#ffffff" />);

    expect(barsOf(drawn)[0]).toHaveStyle({ transform: [{ scaleY: 0.3 }] });

    await act(() => {
      mockListeners.forEach((listener) => {
        listener(aHum());
      });
    });

    const [bass] = barsOf(drawn);

    expect(bass).toHaveStyle({ transform: [{ scaleY: 1 }] });
  });
});
