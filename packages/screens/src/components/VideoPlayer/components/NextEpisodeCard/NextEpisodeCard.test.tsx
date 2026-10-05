import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import { NextEpisodeCard } from './NextEpisodeCard';

const EPISODE = {
  id: 'episode-2',
  title: 'Second Episode',
  seasonNumber: 1,
  episodeNumber: 2,
  hasBackdrop: true,
};

const OFFER = { secondsLeft: 21.4, counted: 0.4 };

describe('NextEpisodeCard', () => {
  it('names the episode it offers by its place and title', () => {
    render(
      <NextEpisodeCard
        episode={EPISODE}
        offer={OFFER}
        isCounting
        onPlay={vi.fn()}
        onWatchCredits={vi.fn()}
      />,
    );

    expect(screen.getByText('Next Episode')).toBeInTheDocument();
    expect(screen.getByText('S1 E2 · Second Episode')).toBeInTheDocument();
  });

  it('starts it when pressed', async () => {
    const actor = userEvent.setup();
    const onPlay = vi.fn();
    render(
      <NextEpisodeCard
        episode={EPISODE}
        offer={OFFER}
        isCounting
        onPlay={onPlay}
        onWatchCredits={vi.fn()}
      />,
    );

    await actor.click(screen.getByRole('button', { name: 'Play Next' }));

    expect(onPlay).toHaveBeenCalledOnce();
  });

  it('stays with the credits without starting anything', async () => {
    const actor = userEvent.setup();
    const onPlay = vi.fn();
    const onWatchCredits = vi.fn();
    render(
      <NextEpisodeCard
        episode={EPISODE}
        offer={OFFER}
        isCounting
        onPlay={onPlay}
        onWatchCredits={onWatchCredits}
      />,
    );

    await actor.click(screen.getByRole('button', { name: 'Watch Credits' }));

    expect(onWatchCredits).toHaveBeenCalledOnce();
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('writes out the seconds left for somebody who asked for less motion', () => {
    render(
      <MotionConfig reducedMotion="always">
        <NextEpisodeCard
          episode={EPISODE}
          offer={OFFER}
          isCounting
          onPlay={vi.fn()}
          onWatchCredits={vi.fn()}
        />
      </MotionConfig>,
    );

    expect(screen.getByText('Starts in 22 seconds')).toBeInTheDocument();
  });

  it('counts nothing down where the next episode will not start on its own', () => {
    render(
      <MotionConfig reducedMotion="always">
        <NextEpisodeCard
          episode={EPISODE}
          offer={OFFER}
          isCounting={false}
          onPlay={vi.fn()}
          onWatchCredits={vi.fn()}
        />
      </MotionConfig>,
    );

    expect(screen.queryByText(/Starts in/)).not.toBeInTheDocument();
  });
});
