import { AccessibilityInfo } from 'react-native';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import { TheNextEpisode } from './TheNextEpisode';

const OFFER = { secondsLeft: 21.4, counted: 0.4 };

describe('TheNextEpisode', () => {
  it('offers to play the next episode or stay for the credits', async () => {
    const drawn = await render(
      <TheNextEpisode offer={OFFER} isCounting onPlay={jest.fn()} onWatchCredits={jest.fn()} />,
    );

    expect(drawn.getByText('Play Next')).toBeTruthy();
    expect(drawn.getByText('Watch Credits')).toBeTruthy();
  });

  it('starts it when pressed', async () => {
    const onPlay = jest.fn();
    const drawn = await render(
      <TheNextEpisode offer={OFFER} isCounting onPlay={onPlay} onWatchCredits={jest.fn()} />,
    );

    await userEvent.press(drawn.getByText('Play Next'));

    expect(onPlay).toHaveBeenCalled();
  });

  it('stays with the credits without starting anything', async () => {
    const onPlay = jest.fn();
    const onWatchCredits = jest.fn();
    const drawn = await render(
      <TheNextEpisode offer={OFFER} isCounting onPlay={onPlay} onWatchCredits={onWatchCredits} />,
    );

    await userEvent.press(drawn.getByText('Watch Credits'));

    expect(onWatchCredits).toHaveBeenCalled();
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('writes out the seconds left for somebody who asked for less motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    const drawn = await render(
      <TheNextEpisode offer={OFFER} isCounting onPlay={jest.fn()} onWatchCredits={jest.fn()} />,
    );

    await waitFor(() => {
      expect(drawn.getByText('Starts in 22 seconds')).toBeTruthy();
    });
  });

  it('counts nothing down where the next episode will not start on its own', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    const drawn = await render(
      <TheNextEpisode
        offer={OFFER}
        isCounting={false}
        onPlay={jest.fn()}
        onWatchCredits={jest.fn()}
      />,
    );

    expect(drawn.queryByText(/Starts in/)).toBeNull();
  });
});
