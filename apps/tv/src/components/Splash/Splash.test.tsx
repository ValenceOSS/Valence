import { act, render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { Splash } from '@ValenceTv/components/Splash/Splash';

const runsInJavaScript = Animated.timing;

describe('Splash', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest
      .spyOn(Animated, 'timing')
      .mockImplementation((value, config) =>
        runsInJavaScript(value, { ...config, useNativeDriver: false }),
      );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('stays while the app is still finding out who is signed in', async () => {
    const onGone = jest.fn();
    const drawn = await render(<Splash isDone={false} onGone={onGone} />);

    await act(() => {
      jest.advanceTimersByTime(10_000);
    });

    expect(onGone).not.toHaveBeenCalled();
    expect(drawn.root).toHaveStyle({ opacity: 1 });
  });

  it('fades away once the app is ready, and says when it has gone', async () => {
    const onGone = jest.fn();
    const drawn = await render(<Splash isDone={false} onGone={onGone} />);

    await drawn.rerender(<Splash isDone onGone={onGone} />);

    await act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onGone).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(onGone).toHaveBeenCalledTimes(1);
    expect(drawn.root).toHaveStyle({ opacity: 0 });
  });
});
