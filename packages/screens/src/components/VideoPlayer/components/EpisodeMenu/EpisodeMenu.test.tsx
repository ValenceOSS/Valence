import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { EpisodeMenu } from './EpisodeMenu';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const episodeOf = (
  seasonNumber: number | null,
  number: number,
  changes: Partial<MediaSummary> = {},
): MediaSummary => ({
  id: `00000000-0000-4000-8000-${String(seasonNumber ?? 9)
    .padStart(6, '0')
    .concat(number.toString().padStart(6, '0'))}`,
  libraryId: '00000000-0000-4000-8000-000000000000',
  title: `Episode ${String(seasonNumber)}.${number.toString()}`,
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
  seasonNumber,
  episodeNumber: number,
  ...changes,
});

const FIRST = [episodeOf(1, 1), episodeOf(1, 2), episodeOf(1, 3)];
const SECOND = [episodeOf(2, 1), episodeOf(2, 2)];
const SPECIALS = [episodeOf(0, 1)];
const SHOW = [...SECOND, ...SPECIALS, ...FIRST];

const idOf = (episode: MediaSummary | undefined): string => episode?.id ?? '';

beforeEach(() => {
  vi.stubGlobal('fetch', answerMusicRequests());
});

const open = async (actor: ReturnType<typeof userEvent.setup>) => {
  await actor.click(screen.getByRole('button', { name: 'Episodes' }));
};

const panel = () => screen.getByRole('dialog', { name: 'Episodes' });

describe('EpisodeMenu', () => {
  it('is not drawn at all for a film, since a control that can do nothing is furniture', () => {
    renderInAnAddress(<EpisodeMenu episodes={[]} playingId="whatever" onSelect={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Episodes' })).not.toBeInTheDocument();
  });

  it('opens on the season playing, with the episode on now marked as current', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu episodes={SHOW} playingId={idOf(FIRST[1])} onSelect={vi.fn()} />,
    );

    await open(actor);

    const rows = within(panel()).getAllByRole('button', { name: /^Episode 1\.\d/u });

    expect(rows).toHaveLength(FIRST.length);
    expect(within(panel()).getByRole('button', { name: /Episode 1\.2/u })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('offers a switcher between seasons where there is more than one', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu episodes={SHOW} playingId={idOf(FIRST[0])} onSelect={vi.fn()} />,
    );

    await open(actor);

    expect(within(panel()).getByRole('button', { name: 'Seasons' })).toBeInTheDocument();
  });

  it('has no switcher for a programme of one season', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu episodes={FIRST} playingId={idOf(FIRST[0])} onSelect={vi.fn()} />,
    );

    await open(actor);

    expect(within(panel()).queryByRole('button', { name: 'Seasons' })).not.toBeInTheDocument();
  });

  it('marks a finished episode as watched instead of saying how long it runs', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu
        episodes={FIRST}
        playingId={idOf(FIRST[2])}
        onSelect={vi.fn()}
        watchedFractionFor={(id) => (id === idOf(FIRST[0]) ? 1 : undefined)}
      />,
    );

    await open(actor);

    expect(within(panel()).getByLabelText('Watched')).toBeInTheDocument();
  });

  it('plays the episode chosen and closes', async () => {
    const actor = userEvent.setup();
    const onSelect = vi.fn();

    renderInAnAddress(
      <EpisodeMenu episodes={FIRST} playingId={idOf(FIRST[0])} onSelect={onSelect} />,
    );

    await open(actor);
    await actor.click(within(panel()).getByRole('button', { name: /Episode 1\.3/u }));

    expect(onSelect).toHaveBeenCalledWith(FIRST[2]);
    expect(screen.queryByRole('dialog', { name: 'Episodes' })).not.toBeInTheDocument();
  });
});
