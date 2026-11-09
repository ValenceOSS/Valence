import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SessionLane } from './SessionLane';

const drawLane = () =>
  render(
    <SessionLane name="Dan" face={<span>Face</span>} count={3} size="medium">
      <div>First card</div>
      <div>Second card</div>
      <div>Third card</div>
    </SessionLane>,
  );

const overflowing = (track: HTMLElement, scrollLeft: number) => {
  Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 3000 });
  Object.defineProperty(track, 'clientWidth', { configurable: true, value: 1000 });
  Object.defineProperty(track, 'scrollLeft', {
    configurable: true,
    writable: true,
    value: scrollLeft,
  });

  fireEvent.scroll(track);
};

const trackOf = () => {
  const track = screen.getByText('First card').parentElement;

  if (track === null) {
    throw new Error('The cards sit in a row.');
  }

  return track;
};

describe('SessionLane', () => {
  it('names the panel after whose sessions they are, with their face and how many', () => {
    drawLane();

    expect(screen.getByRole('region', { name: 'Dan' })).toBeInTheDocument();
    expect(screen.getByText('Face')).toBeInTheDocument();
    expect(screen.getByText('3 sessions')).toBeInTheDocument();
  });

  it('folds the cards away under the name, and unfolds them again', async () => {
    const user = userEvent.setup();

    drawLane();

    await user.click(screen.getByRole('button', { name: 'Hide the sessions of Dan' }));

    await waitFor(() => {
      expect(screen.queryByText('First card')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Dan')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show the sessions of Dan' }));

    expect(await screen.findByText('First card')).toBeInTheDocument();
  });

  it('offers no arrows while every card fits', () => {
    drawLane();

    expect(screen.queryByRole('button', { name: /through the sessions of Dan/ })).toBeNull();
  });

  it('offers a way on, and dims the way back, once the row runs off the edge', () => {
    drawLane();
    overflowing(trackOf(), 0);

    expect(screen.getByRole('button', { name: 'On through the sessions of Dan' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Back through the sessions of Dan' })).toBeDisabled();
  });

  it('dims the way on once the row has reached its end', () => {
    drawLane();
    overflowing(trackOf(), 2000);

    expect(screen.getByRole('button', { name: 'On through the sessions of Dan' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back through the sessions of Dan' })).toBeEnabled();
  });

  it('moves the row on a page when the way on is pressed', async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();

    drawLane();

    const track = trackOf();

    track.scrollTo = scrollTo;
    overflowing(track, 0);

    await user.click(screen.getByRole('button', { name: 'On through the sessions of Dan' }));

    expect(scrollTo).toHaveBeenCalledWith({ left: 850, behavior: 'smooth' });
  });

  it('hides the arrows while the cards are folded away', async () => {
    const user = userEvent.setup();

    drawLane();
    overflowing(trackOf(), 0);

    await user.click(screen.getByRole('button', { name: 'Hide the sessions of Dan' }));

    expect(screen.queryByRole('button', { name: /through the sessions of Dan/ })).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SessionLane.displayName).toBe('SessionLane');
  });
});
