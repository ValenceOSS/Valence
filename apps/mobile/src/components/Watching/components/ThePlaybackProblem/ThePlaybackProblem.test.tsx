import { Share } from 'react-native';
import { render, userEvent } from '@testing-library/react-native';
import { describePlaybackProblem } from '@ValenceClient/playback/describePlaybackProblem';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { ThePlaybackProblem } from './ThePlaybackProblem';

describe('ThePlaybackProblem', () => {
  it('says what is wrong in a few words, who to tell, and the code', async () => {
    const drawn = await render(
      <ThePlaybackProblem
        problem={describePlaybackProblem('damaged')}
        details=""
        onClose={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('This file is damaged')).toBeTruthy();
    expect(drawn.getByText('Let your server’s admin know so they can replace it.')).toBeTruthy();
    expect(drawn.getByText('Error 101')).toBeTruthy();
    expect(drawn.queryByText('Try again')).toBeNull();
  });

  it('offers to try again for what can pass', async () => {
    const onRetry = jest.fn();
    const drawn = await render(
      <ThePlaybackProblem
        problem={describePlaybackProblem('unreachable')}
        details=""
        onClose={jest.fn()}
        onRetry={onRetry}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByText('Try again'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('offers to sign in where the sign-in lapsed', async () => {
    const onSignIn = jest.fn();
    const drawn = await render(
      <ThePlaybackProblem
        problem={describePlaybackProblem('signedOut')}
        details=""
        onClose={jest.fn()}
        onSignIn={onSignIn}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByText('Sign in'));

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('shares the details, for the server’s admin', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    const drawn = await render(
      <ThePlaybackProblem
        problem={describePlaybackProblem('damaged')}
        details="Error 101: This file is damaged"
        onClose={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByText('Share details'));

    expect(share).toHaveBeenCalledWith({ message: 'Error 101: This file is damaged' });
  });

  it('keeps the way out', async () => {
    const onClose = jest.fn();
    const drawn = await render(
      <ThePlaybackProblem
        problem={describePlaybackProblem('damaged')}
        details=""
        onClose={onClose}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByLabelText('Stop watching'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ThePlaybackProblem.displayName).toBe('ThePlaybackProblem');
  });
});
