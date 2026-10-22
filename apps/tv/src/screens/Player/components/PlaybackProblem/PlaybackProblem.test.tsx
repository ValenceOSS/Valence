import { render, userEvent } from '@testing-library/react-native';
import { describePlaybackProblem } from '@ValenceClient/playback/describePlaybackProblem';
import { PlaybackProblem } from './PlaybackProblem';

describe('PlaybackProblem', () => {
  it('says what is wrong, who to tell, and the code to read out', async () => {
    const drawn = await render(
      <PlaybackProblem problem={describePlaybackProblem('damaged')} onLeave={jest.fn()} />,
    );

    expect(drawn.getByText('This file is damaged')).toBeTruthy();
    expect(drawn.getByText('Let your server’s admin know so they can replace it.')).toBeTruthy();
    expect(drawn.getByText('Error 101')).toBeTruthy();
    expect(drawn.queryByText('Try again')).toBeNull();
  });

  it('goes back', async () => {
    const onLeave = jest.fn();
    const drawn = await render(
      <PlaybackProblem problem={describePlaybackProblem('damaged')} onLeave={onLeave} />,
    );

    await userEvent.press(drawn.getByText('Go back'));

    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('offers to try again for what can pass', async () => {
    const onRetry = jest.fn();
    const drawn = await render(
      <PlaybackProblem
        problem={describePlaybackProblem('streamLost')}
        onLeave={jest.fn()}
        onRetry={onRetry}
      />,
    );

    await userEvent.press(drawn.getByText('Try again'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('offers to sign in where the sign-in lapsed', async () => {
    const onSignIn = jest.fn();
    const drawn = await render(
      <PlaybackProblem
        problem={describePlaybackProblem('signedOut')}
        onLeave={jest.fn()}
        onSignIn={onSignIn}
      />,
    );

    await userEvent.press(drawn.getByText('Sign in'));

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PlaybackProblem.displayName).toBe('PlaybackProblem');
  });
});
