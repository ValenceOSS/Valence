import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SeasonMate } from './SeasonMate';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const episode: MediaSummary = {
  id: '9c858901-8a57-4791-81fe-4c455b099bc9',
  libraryId: '11111111-1111-4111-8111-111111111111',
  title: 'I Died',
  year: 2023,
  durationSeconds: 1385,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  seriesTitle: 'The Dangers in My Heart',
  seasonNumber: 1,
  episodeNumber: 2,
};

describe('SeasonMate', () => {
  it('names the episode by its number and title, and how long it runs', () => {
    render(<SeasonMate episode={episode} onSelect={vi.fn()} />);

    expect(screen.getByText('2. I Died')).toBeInTheDocument();
    expect(screen.getByText('23:05')).toBeInTheDocument();
  });

  it('opens the episode when pressed', async () => {
    const onSelect = vi.fn();

    render(<SeasonMate episode={episode} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Episode 2, I Died' }));

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('draws how far it was watched beneath its picture, only while part watched', () => {
    const { rerender } = render(<SeasonMate episode={episode} watched={0.5} onSelect={vi.fn()} />);

    expect(screen.getByRole('img', { name: '50% watched' })).toBeInTheDocument();

    rerender(<SeasonMate episode={episode} watched={1} onSelect={vi.fn()} />);

    expect(screen.queryByRole('img', { name: /% watched/ })).not.toBeInTheDocument();
    expect(screen.getByText('23:05 · Watched')).toBeInTheDocument();
  });

  it('names an episode with no number by its title alone', () => {
    render(<SeasonMate episode={{ ...episode, episodeNumber: null }} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'I Died' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SeasonMate.displayName).toBe('SeasonMate');
  });
});
