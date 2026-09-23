import { act, render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { PageDots } from '@ValenceTv/components/PageDots/PageDots';

type Drawn = Awaited<ReturnType<typeof render>>;

const dotsOf = (drawn: Drawn) =>
  drawn.root?.children.flatMap((dot) => (typeof dot === 'string' ? [] : [dot])) ?? [];

const runsInJavaScript = Animated.timing;

describe('PageDots', () => {
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

  it('draws a dot for each turn, with the current one long', async () => {
    const drawn = await render(
      <PageDots count={4} current={1} turnMs={8000} isRunning={false} onTurnDone={jest.fn()} />,
    );
    const dots = dotsOf(drawn);

    expect(dots).toHaveLength(4);
    expect(dots[0]).toHaveStyle({ width: 12 });
    expect(dots[1]).toHaveStyle({ width: 56 });
  });

  it('says when the turn has run out', async () => {
    const onTurnDone = jest.fn();

    await render(
      <PageDots count={3} current={0} turnMs={8000} isRunning onTurnDone={onTurnDone} />,
    );

    await act(() => {
      jest.advanceTimersByTime(7000);
    });

    expect(onTurnDone).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(onTurnDone).toHaveBeenCalledTimes(1);
  });

  it('holds the turn where it is and carries on from there', async () => {
    const onTurnDone = jest.fn();
    const drawn = await render(
      <PageDots count={3} current={0} turnMs={8000} isRunning onTurnDone={onTurnDone} />,
    );

    await act(() => {
      jest.advanceTimersByTime(6000);
    });

    await drawn.rerender(
      <PageDots count={3} current={0} turnMs={8000} isRunning={false} onTurnDone={onTurnDone} />,
    );

    await act(() => {
      jest.advanceTimersByTime(20_000);
    });

    expect(onTurnDone).not.toHaveBeenCalled();

    await drawn.rerender(
      <PageDots count={3} current={0} turnMs={8000} isRunning onTurnDone={onTurnDone} />,
    );

    await act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(onTurnDone).toHaveBeenCalledTimes(1);
  });

  it('starts the fill again for a new turn', async () => {
    const onTurnDone = jest.fn();
    const drawn = await render(
      <PageDots count={3} current={0} turnMs={8000} isRunning onTurnDone={onTurnDone} />,
    );

    await act(() => {
      jest.advanceTimersByTime(6000);
    });

    await drawn.rerender(
      <PageDots count={3} current={1} turnMs={8000} isRunning onTurnDone={onTurnDone} />,
    );

    await act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(onTurnDone).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(onTurnDone).toHaveBeenCalledTimes(1);
  });
});
