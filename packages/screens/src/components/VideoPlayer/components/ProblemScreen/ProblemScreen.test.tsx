import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describePlaybackProblem } from '@ValenceClient/playback/describePlaybackProblem';
import { ProblemScreen } from './ProblemScreen';

describe('ProblemScreen', () => {
  it('shows nothing while nothing has gone wrong', () => {
    const { container } = render(<ProblemScreen problem={null} details="" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('says what is wrong in a few words, and who to tell', () => {
    render(<ProblemScreen problem={describePlaybackProblem('damaged')} details="" />);

    expect(screen.getByRole('alert')).toHaveTextContent('This file is damaged');
    expect(
      screen.getByText('Let your server’s admin know so they can replace it.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('gives the code the documentation lists it under', () => {
    render(<ProblemScreen problem={describePlaybackProblem('damaged')} details="" />);

    expect(screen.getByText('Error 101')).toBeInTheDocument();
  });

  it('offers to try again for what can pass', async () => {
    const onRetry = vi.fn();

    render(
      <ProblemScreen
        problem={describePlaybackProblem('unreachable')}
        details=""
        onRetry={onRetry}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('offers to sign in where the sign-in lapsed', async () => {
    const onSignIn = vi.fn();

    render(
      <ProblemScreen
        problem={describePlaybackProblem('signedOut')}
        details=""
        onSignIn={onSignIn}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(onSignIn).toHaveBeenCalledOnce();
  });

  it('copies the details and says so', async () => {
    const actor = userEvent.setup();
    const written = vi.spyOn(navigator.clipboard, 'writeText');

    render(
      <ProblemScreen problem={describePlaybackProblem('damaged')} details="Error 101: damaged" />,
    );
    await actor.click(screen.getByRole('button', { name: 'Copy details' }));

    expect(written).toHaveBeenCalledWith('Error 101: damaged');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProblemScreen.displayName).toBe('ProblemScreen');
  });
});
