import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { TheDots } from './TheDots';

jest.mock('@ValenceNative/motion/usePrefersStillness', () => ({
  usePrefersStillness: jest.fn(() => false),
}));

beforeEach(() => {
  jest.mocked(usePrefersStillness).mockReturnValue(false);
});

describe('TheDots', () => {
  it('draws a dot for each title, and a fill only in the one showing', async () => {
    const drawn = await render(<TheDots count={4} at={1} filled={new Animated.Value(0.5)} />);
    expect(drawn.getAllByTestId('dot')).toHaveLength(4);
    expect(drawn.getAllByTestId('dot-fill')).toHaveLength(1);
  });

  it('grows and shrinks the dots when the one showing changes, and not on every draw', async () => {
    const timing = jest.spyOn(Animated, 'timing');
    const filled = new Animated.Value(0);
    const drawn = await render(<TheDots count={3} at={0} filled={filled} />);
    const before = timing.mock.calls.length;

    await drawn.rerender(<TheDots count={3} at={0} filled={filled} />);

    expect(timing.mock.calls.length).toBe(before);

    await drawn.rerender(<TheDots count={3} at={1} filled={filled} />);

    expect(timing.mock.calls.length).toBeGreaterThan(before);
    timing.mockRestore();
  });

  it('grows the pill and moves the dots along on the native side, laying nothing out again', async () => {
    const timing = jest.spyOn(Animated, 'timing');
    const filled = new Animated.Value(0);
    const drawn = await render(<TheDots count={3} at={0} filled={filled} />);

    await drawn.rerender(<TheDots count={3} at={2} filled={filled} />);

    expect(timing.mock.calls.length).toBeGreaterThan(0);
    expect(timing.mock.calls.every(([, config]) => config.useNativeDriver)).toBe(true);
    for (const dot of drawn.getAllByTestId('dot')) {
      expect(dot).toHaveStyle({ width: 24 });
    }
    timing.mockRestore();
  });

  it('changes the pill without moving for somebody who wants less motion', async () => {
    jest.mocked(usePrefersStillness).mockReturnValue(true);
    const timing = jest.spyOn(Animated, 'timing');
    const filled = new Animated.Value(0);
    const drawn = await render(<TheDots count={3} at={0} filled={filled} />);

    await drawn.rerender(<TheDots count={3} at={1} filled={filled} />);

    expect(timing).not.toHaveBeenCalled();
    timing.mockRestore();
  });

  it('draws a dot for each title when more come', async () => {
    const filled = new Animated.Value(0);
    const drawn = await render(<TheDots count={2} at={0} filled={filled} />);

    await drawn.rerender(<TheDots count={4} at={0} filled={filled} />);

    expect(drawn.getAllByTestId('dot')).toHaveLength(4);
  });

  it('draws nothing for a single title', async () => {
    const drawn = await render(<TheDots count={1} at={0} filled={new Animated.Value(0)} />);

    expect(drawn.toJSON()).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TheDots.displayName).toBe('TheDots');
  });
});
