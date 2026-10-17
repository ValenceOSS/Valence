import { screen, waitFor, within } from '@testing-library/react';
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

  it('opens on the season playing, under the name of the show', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu episodes={SHOW} playingId={idOf(SECOND[1])} onSelect={vi.fn()} />,
    );
    await open(actor);

    const heading = await screen.findByRole('heading', { name: /Season 2/ });

    expect(heading).toHaveTextContent('Some Show');
    expect(within(panel()).getByRole('button', { name: /Episode 2\.1/ })).toBeInTheDocument();
    expect(within(panel()).queryByRole('button', { name: /Episode 1\.1/ })).not.toBeInTheDocument();
  });

  it('opens out the one playing, and marks it', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu episodes={SHOW} playingId={idOf(SECOND[1])} onSelect={vi.fn()} />,
    );
    await open(actor);

    const playing = await screen.findByRole('button', { name: /Episode 2\.2/ });

    expect(playing).toHaveAttribute('aria-current', 'true');
    expect(playing).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Episode 2\.1/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('says how long the others are, which is what somebody is judging', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu episodes={FIRST} playingId={idOf(FIRST[1])} onSelect={vi.fn()} />,
    );
    await open(actor);

    expect(await screen.findByRole('button', { name: /Episode 1\.1.*25 min/ })).toBeInTheDocument();
  });

  it('opens out the one pointed at, once the pointer settles on it', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu episodes={FIRST} playingId={idOf(FIRST[0])} onSelect={vi.fn()} />,
    );
    await open(actor);
    await actor.hover(await screen.findByRole('button', { name: /Episode 1\.3/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Episode 1\.3/ })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });
    expect(screen.getByRole('button', { name: /Episode 1\.1/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('reports the episode that was picked, and closes on the way', async () => {
    const onSelect = vi.fn();
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu episodes={FIRST} playingId={idOf(FIRST[0])} onSelect={onSelect} />,
    );
    await open(actor);
    await actor.click(await screen.findByRole('button', { name: /Episode 1\.3/ }));

    expect(onSelect).toHaveBeenCalledWith(FIRST[2]);
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Season 1/ })).not.toBeInTheDocument();
    });
  });

  it('says when it opens, so the bar underneath can stay up', async () => {
    const onOpenChange = vi.fn();
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu
        episodes={FIRST}
        playingId={idOf(FIRST[0])}
        onSelect={vi.fn()}
        onOpenChange={onOpenChange}
      />,
    );
    await open(actor);

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('offers no way to other seasons where there is only one', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu episodes={FIRST} playingId={idOf(FIRST[0])} onSelect={vi.fn()} />,
    );
    await open(actor);
    await screen.findByRole('heading', { name: /Season 1/ });

    expect(screen.queryByRole('button', { name: 'Seasons' })).not.toBeInTheDocument();
  });

  it('goes back to every season, in order with the specials last, marking the one playing', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu episodes={SHOW} playingId={idOf(SECOND[0])} onSelect={vi.fn()} />,
    );
    await open(actor);
    await actor.click(await screen.findByRole('button', { name: 'Seasons' }));

    expect(await screen.findByRole('heading', { name: /Seasons/ })).toBeInTheDocument();

    const seasons = within(panel())
      .getAllByRole('button')
      .map((button) => button.textContent);

    expect(seasons).toEqual([
      expect.stringContaining('Season 1'),
      expect.stringContaining('Season 2'),
      expect.stringContaining('Specials'),
    ]);
    expect(screen.getByRole('button', { name: /Season 2/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('opens another season on the first episode not yet finished', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu
        episodes={SHOW}
        playingId={idOf(SECOND[0])}
        onSelect={vi.fn()}
        watchedFractionFor={(mediaId) => (mediaId === idOf(FIRST[0]) ? 1 : undefined)}
      />,
    );
    await open(actor);
    await actor.click(await screen.findByRole('button', { name: 'Seasons' }));
    await actor.click(await screen.findByRole('button', { name: /Season 1/ }));

    expect(await screen.findByRole('heading', { name: /Season 1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Episode 1\.2/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('says how many episodes are left in a season part watched', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(
      <EpisodeMenu
        episodes={SHOW}
        playingId={idOf(SECOND[0])}
        onSelect={vi.fn()}
        watchedFractionFor={(mediaId) => (mediaId === idOf(FIRST[0]) ? 1 : undefined)}
      />,
    );
    await open(actor);
    await actor.click(await screen.findByRole('button', { name: 'Seasons' }));

    expect(
      await screen.findByRole('button', { name: /Season 1.*2 episodes left/ }),
    ).toBeInTheDocument();
  });

  it('calls itself episodes where a file says nothing about a season', async () => {
    const actor = userEvent.setup();
    const loose = [episodeOf(null, 1), episodeOf(null, 2)];

    renderInAnAddress(
      <EpisodeMenu episodes={loose} playingId={idOf(loose[0])} onSelect={vi.fn()} />,
    );
    await open(actor);

    expect(await screen.findByRole('heading', { name: /Episodes/ })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(EpisodeMenu.displayName).toBe('EpisodeMenu');
  });
});
