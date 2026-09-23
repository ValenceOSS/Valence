import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChooseEpisodes } from './ChooseEpisodes';
import type { ChooseEpisodesProps } from './ChooseEpisodes.types';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const episode = (id: string, episodeNumber: number): MediaSummary => ({
  id,
  libraryId: '11111111-1111-4111-8111-111111111111',
  title: `Episode ${episodeNumber.toString()}`,
  year: 2024,
  durationSeconds: 1400,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
  episodeNumber,
});

const SEASONS = [
  { seasonNumber: 1, episodes: [episode('1-1', 1), episode('1-2', 2)] },
  { seasonNumber: 2, episodes: [episode('2-1', 1)] },
];

const choosing = (overrides: Partial<ChooseEpisodesProps> = {}) =>
  render(
    <ChooseEpisodes
      isOpen
      title="A Sign of Affection"
      seasons={SEASONS}
      held={new Set()}
      onClose={vi.fn()}
      onChosen={vi.fn()}
      {...overrides}
    />,
  );

describe('ChooseEpisodes', () => {
  it('lists every season with its episodes under it', () => {
    choosing();

    expect(screen.getByRole('checkbox', { name: 'Season 1' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Season 2' })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: /Episode/ })).toHaveLength(3);
  });

  it('picks a whole season with its own box', async () => {
    const onChosen = vi.fn();

    choosing({ onChosen });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Season 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Download 2 episodes' }));

    expect(onChosen).toHaveBeenCalledWith(['1-1', '1-2']);
  });

  it('downloads nothing until something is picked', () => {
    choosing();

    expect(screen.getByRole('button', { name: 'Pick some episodes' })).toBeDisabled();
  });

  it('says what is already here, and does not offer it again', () => {
    choosing({ held: new Set(['2-1']) });

    expect(screen.getByText('On this device')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /1\. Episode 1/, description: 'On this device' }),
    ).toBeDisabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ChooseEpisodes.displayName).toBe('ChooseEpisodes');
  });
});
