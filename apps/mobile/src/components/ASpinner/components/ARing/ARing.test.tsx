import { Animated } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { ARing } from './ARing';

jest.mock('@ValenceNative/motion/usePrefersStillness', () => ({
  usePrefersStillness: jest.fn(() => false),
}));

afterEach(() => {
  jest.mocked(usePrefersStillness).mockReturnValue(false);
  jest.restoreAllMocks();
});

describe('ARing', () => {
  it('is drawn the size it is asked for', async () => {
    const drawn = await render(<ARing colour="#ffffff" size={50} label="Loading" />);

    expect(drawn.getByLabelText('Loading')).toHaveStyle({ height: 50, width: 50 });
  });

  it('turns on one animation the phone runs itself, rather than being drawn again each tick', async () => {
    const looping = jest.spyOn(Animated, 'loop');
    const timing = jest.spyOn(Animated, 'timing');

    await render(<ARing colour="#ffffff" />);

    expect(looping).toHaveBeenCalledTimes(1);
    expect(timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ useNativeDriver: true }),
    );
  });

  it('holds still, most of the way lit, for somebody who asked for less movement', async () => {
    jest.mocked(usePrefersStillness).mockReturnValue(true);
    const looping = jest.spyOn(Animated, 'loop');

    const drawn = await render(<ARing colour="#ffffff" label="Loading" />);

    expect(looping).not.toHaveBeenCalled();
    expect(drawn.getByLabelText('Loading')).toBeTruthy();
  });

  it('says it is whole at once when held still and told the wait is over', async () => {
    jest.mocked(usePrefersStillness).mockReturnValue(true);
    const onFilled = jest.fn();

    await render(<ARing colour="#ffffff" isFinishing onFilled={onFilled} />);

    expect(onFilled).toHaveBeenCalled();
  });

  it('says once it is whole after being told the wait is over', async () => {
    jest.useFakeTimers();
    const onFilled = jest.fn();

    await render(<ARing colour="#ffffff" isFinishing onFilled={onFilled} />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });

    expect(onFilled).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('fills the rest from wherever it had turned to once the wait is over', async () => {
    jest.useFakeTimers();
    const onFilled = jest.fn();

    const drawn = await render(<ARing colour="#ffffff" onFilled={onFilled} />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1_500);
    });

    expect(onFilled).not.toHaveBeenCalled();

    await drawn.rerender(<ARing colour="#ffffff" isFinishing onFilled={onFilled} />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1_000);
    });

    expect(onFilled).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
