import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EpisodeRow } from './EpisodeRow';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const episode: MediaSummary = {
  id: '9c858901-8a57-4791-81fe-4c455b099bc9',
  libraryId: '11111111-1111-4111-8111-111111111111',
  title: "Yuki's World",
  year: 2024,
  durationSeconds: 1421,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  seriesTitle: 'A Sign of Affection',
  seasonNumber: 1,
  episodeNumber: 1,
};

describe('EpisodeRow', () => {
  it('names the episode, led by its number, which is what a list of episodes is read by', () => {
    render(<EpisodeRow episode={episode} onPlay={vi.fn()} />);

    expect(screen.getByText("1. Yuki's World")).toBeInTheDocument();
  });

  it('names an episode with no number by its title alone', () => {
    render(<EpisodeRow episode={{ ...episode, episodeNumber: null }} onPlay={vi.fn()} />);

    expect(screen.getByText("Yuki's World")).toBeInTheDocument();
  });

  it('plays the episode when the line is pressed', async () => {
    const onPlay = vi.fn();
    const user = userEvent.setup();
    render(<EpisodeRow episode={episode} onPlay={onPlay} />);

    await user.click(screen.getByRole('button', { name: /Play/ }));

    expect(onPlay).toHaveBeenCalledWith(episode, 0);
  });

  it('resumes from where it was left', async () => {
    const onPlay = vi.fn();
    const user = userEvent.setup();
    render(<EpisodeRow episode={episode} onPlay={onPlay} resumeSeconds={420} />);

    await user.click(screen.getByRole('button', { name: /Resume/ }));

    expect(onPlay).toHaveBeenCalledWith(episode, 420);
  });

  it('says it will resume rather than start, so the press is no surprise', () => {
    render(<EpisodeRow episode={episode} onPlay={vi.fn()} resumeSeconds={420} />);

    expect(screen.getByRole('button', { name: /Resume .* from 7:00/ })).toBeInTheDocument();
  });

  it('offers reading about it as a separate press', async () => {
    const onInspect = vi.fn();
    const user = userEvent.setup();
    render(<EpisodeRow episode={episode} onPlay={vi.fn()} onInspect={onInspect} />);

    await user.click(screen.getByRole('button', { name: /About/ }));

    expect(onInspect).toHaveBeenCalledWith(episode);
  });

  it('offers nothing to read about when there is nowhere to go', () => {
    render(<EpisodeRow episode={episode} onPlay={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /About/ })).not.toBeInTheDocument();
  });

  it('ticks an episode that has been watched through', () => {
    render(<EpisodeRow episode={episode} watchedFraction={1} onPlay={vi.fn()} />);

    expect(screen.getByRole('img', { name: 'Watched' })).toBeInTheDocument();
  });

  it('does not tick an episode that is only part watched', () => {
    render(<EpisodeRow episode={episode} watchedFraction={0.5} onPlay={vi.fn()} />);

    expect(screen.queryByRole('img', { name: 'Watched' })).not.toBeInTheDocument();
  });

  it('offers to mark an unwatched episode as watched, in the white button', async () => {
    const user = userEvent.setup();
    const onMarkWatched = vi.fn();

    render(<EpisodeRow episode={episode} onPlay={vi.fn()} onMarkWatched={onMarkWatched} />);

    const mark = screen.getByRole('button', { name: "Mark Yuki's World as watched" });

    expect(mark).toHaveTextContent('Mark as watched');
    expect(mark).toHaveClass('bg-white');

    await user.click(mark);

    expect(onMarkWatched).toHaveBeenCalledWith(episode, true);
  });

  it('says a watched episode is watched, and unmarks it when pressed again', async () => {
    const user = userEvent.setup();
    const onMarkWatched = vi.fn();

    render(
      <EpisodeRow
        episode={episode}
        watchedFraction={1}
        onPlay={vi.fn()}
        onMarkWatched={onMarkWatched}
      />,
    );

    const mark = screen.getByRole('button', { name: "Mark Yuki's World as unwatched" });

    expect(mark).toHaveTextContent('Watched');
    expect(mark).not.toHaveClass('bg-white');

    await user.click(mark);

    expect(onMarkWatched).toHaveBeenCalledWith(episode, false);
  });

  it('draws how far it was watched beneath the picture, only for an episode part watched', () => {
    const { rerender } = render(
      <EpisodeRow episode={episode} watchedFraction={0.25} onPlay={vi.fn()} />,
    );

    expect(screen.getByRole('img', { name: '25% watched' })).toBeInTheDocument();

    rerender(<EpisodeRow episode={episode} watchedFraction={0} onPlay={vi.fn()} />);

    expect(screen.queryByRole('img', { name: /% watched/ })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(EpisodeRow.displayName).toBe('EpisodeRow');
  });

  it('says when it aired, beside how long it runs, where the catalogue dates it', () => {
    render(<EpisodeRow episode={episode} onPlay={vi.fn()} airs="Aired 2 Jan 2024" />);

    expect(screen.getByText(/Aired 2 Jan 2024/)).toBeInTheDocument();
  });

  it('says nothing of a date it was not given', () => {
    render(<EpisodeRow episode={episode} onPlay={vi.fn()} />);

    expect(screen.queryByText(/Aired|Airs/)).not.toBeInTheDocument();
  });
});
