import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SeasonLine } from './SeasonLine';
import type { SeasonLineProps } from './SeasonLine.types';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const episodeOf = (number: number): MediaSummary => ({
  id: `00000000-0000-4000-8000-${number.toString().padStart(12, '0')}`,
  libraryId: '00000000-0000-4000-8000-000000000000',
  title: `Episode ${number.toString()}`,
  year: 2026,
  durationSeconds: 1500,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
  seriesTitle: 'Some Show',
  seasonNumber: 2,
  episodeNumber: number,
});

const SEASON = { seasonNumber: 2, episodes: [episodeOf(1), episodeOf(2), episodeOf(3)] };

const draw = (changes: Partial<SeasonLineProps> = {}) =>
  render(
    <SeasonLine
      season={SEASON}
      name="Season 2"
      isOn={false}
      isMoving={false}
      watchedCount={0}
      onChoose={vi.fn()}
      {...changes}
    />,
  );

describe('SeasonLine', () => {
  it('names the season and how many episodes it has where none are watched', () => {
    draw();

    expect(screen.getByRole('button', { name: /Season 2.*3 episodes/ })).toBeInTheDocument();
  });

  it('says how many are left once some are watched, with a bar for how far along it is', () => {
    draw({ watchedCount: 1 });

    expect(screen.getByRole('button', { name: /2 episodes left/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /33%/ })).toBeInTheDocument();
  });

  it('marks a season that is all watched', () => {
    draw({ watchedCount: 3 });

    expect(screen.getByRole('img', { name: 'Watched' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3 episodes/ })).toBeInTheDocument();
  });

  it('marks the season the episode on now is in', () => {
    draw({ isOn: true });

    expect(screen.getByRole('button', { name: /Season 2/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('img', { name: 'Now playing' })).toBeInTheDocument();
  });

  it('opens the season when pressed', async () => {
    const onChoose = vi.fn();
    const actor = userEvent.setup();

    draw({ onChoose });
    await actor.click(screen.getByRole('button', { name: /Season 2/ }));

    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SeasonLine.displayName).toBe('SeasonLine');
  });
});
