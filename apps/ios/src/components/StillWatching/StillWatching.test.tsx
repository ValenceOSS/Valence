import { act, render, userEvent } from '@testing-library/react-native';
import { StillWatching } from './StillWatching';

afterEach(() => {
  jest.useRealTimers();
});

describe('StillWatching', () => {
  it('asks, rather than playing on to an empty room', async () => {
    const drawn = await render(
      <StillWatching
        upNext="Pilot"
        secondsToAnswer={90}
        onCarryOn={jest.fn()}
        onStop={jest.fn()}
      />,
    );

    expect(drawn.getByText('Are you still watching?')).toBeTruthy();
  });

  it('says what would play, so the answer is about something', async () => {
    const drawn = await render(
      <StillWatching
        upNext="Pilot"
        secondsToAnswer={90}
        onCarryOn={jest.fn()}
        onStop={jest.fn()}
      />,
    );

    expect(drawn.getByText(/Pilot is up next/u)).toBeTruthy();
  });

  it('carries on when they say they are there', async () => {
    const onCarryOn = jest.fn();
    const drawn = await render(
      <StillWatching
        upNext="Pilot"
        secondsToAnswer={90}
        onCarryOn={onCarryOn}
        onStop={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByText('Still watching'));

    expect(onCarryOn).toHaveBeenCalled();
  });

  it('stops when they say so', async () => {
    const onStop = jest.fn();
    const drawn = await render(
      <StillWatching upNext="Pilot" secondsToAnswer={90} onCarryOn={jest.fn()} onStop={onStop} />,
    );

    await userEvent.press(drawn.getByText('Stop'));

    expect(onStop).toHaveBeenCalled();
  });

  it('counts down how long is left to answer', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    const drawn = await render(
      <StillWatching upNext="Pilot" secondsToAnswer={5} onCarryOn={jest.fn()} onStop={jest.fn()} />,
    );

    await act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(drawn.getByText('Stopping in 3 seconds.')).toBeTruthy();
  });

  it('takes nobody answering as a no', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    const onStop = jest.fn();

    await render(
      <StillWatching upNext="Pilot" secondsToAnswer={3} onCarryOn={jest.fn()} onStop={onStop} />,
    );

    await act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(onStop).toHaveBeenCalled();
  });
});
