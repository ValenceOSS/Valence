import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { EpisodeLine } from './EpisodeLine';
import type { EpisodeLineProps } from './EpisodeLine.types';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const EPISODE: MediaSummary = {
  id: '00000000-0000-4000-8000-000000000004',
  libraryId: '00000000-0000-4000-8000-000000000000',
  title: 'The Fourth One',
  year: 2026,
  durationSeconds: 1500,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  seriesTitle: 'Some Show',
  seasonNumber: 1,
  episodeNumber: 4,
};

const DETAILS = {
  id: EPISODE.id,
  libraryId: EPISODE.libraryId,
  title: EPISODE.title,
  year: 2026,
  container: 'mkv',
  durationSeconds: 1500,
  videoCodec: 'h264',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 1920,
  height: 1080,
  videoRange: 'SDR',
  bitrateKbps: 6000,
  audioStreams: [{ index: 1, codec: 'aac', channels: 2, isDefault: true, isAtmos: false }],
  subtitleStreams: [],
  addedAt: '2026-01-01T00:00:00.000Z',
  metadata: {
    hasPoster: false,
    hasBackdrop: true,
    hasLogo: false,
    overview: 'Somebody finds something.',
  },
};

let fetched = answerMusicRequests();

beforeEach(() => {
  fetched = answerMusicRequests({ [`/api/media/${EPISODE.id}`]: DETAILS });
  vi.stubGlobal('fetch', fetched);
});

const draw = (changes: Partial<EpisodeLineProps> = {}) => {
  const props: EpisodeLineProps = {
    episode: EPISODE,
    isOn: false,
    isMoving: false,
    isOpen: false,
    onPoint: vi.fn(),
    onStopPointing: vi.fn(),
    onOpen: vi.fn(),
    onChoose: vi.fn(),
    ...changes,
  };

  renderInAnAddress(<EpisodeLine {...props} />);

  return props;
};

const line = () => screen.getByRole('button', { name: /The Fourth One/ });

const addressOf = (input: string | URL | Request): string =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

const askedForDetails = () =>
  fetched.mock.calls.some(([input]) => addressOf(input).includes(`/api/media/${EPISODE.id}`));

describe('EpisodeLine', () => {
  it('reads as one line: its number, its name and how long it runs', () => {
    draw();

    expect(line()).toHaveAccessibleName(/4.*The Fourth One.*25 min/);
  });

  it('marks one that is watched in place of its length', () => {
    draw({ watchedFraction: 1 });

    expect(screen.getByRole('img', { name: 'Watched' })).toBeInTheDocument();
    expect(line()).not.toHaveAccessibleName(/25 min/);
  });

  it('marks the one on now in place of its number', () => {
    draw({ isOn: true });

    expect(line()).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('img', { name: 'Now playing' })).toBeInTheDocument();
  });

  it('leaves its details unasked for until it is opened', () => {
    draw();

    expect(line()).toHaveAttribute('aria-expanded', 'false');
    expect(askedForDetails()).toBe(false);
  });

  it('opened, says what the episode is about', async () => {
    draw({ isOpen: true });

    expect(line()).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByText('Somebody finds something.')).toBeInTheDocument();
  });

  it('opened part way through, says how far along it is and how long is left', async () => {
    draw({ isOpen: true, watchedFraction: 0.5 });

    expect(await screen.findByText('13 min left')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /50%/ })).toBeInTheDocument();
  });

  it('opened while it is on, says so over its still rather than how long is left', async () => {
    draw({ isOpen: true, isOn: true, watchedFraction: 0.5 });

    expect(await screen.findByText('Now playing')).toBeInTheDocument();
    expect(screen.queryByText('13 min left')).not.toBeInTheDocument();
  });

  it('says when a mouse comes onto it and leaves it, so the list can open it once it settles', async () => {
    const actor = userEvent.setup();
    const props = draw();

    await actor.hover(line());
    await actor.unhover(line());

    expect(props.onPoint).toHaveBeenCalledTimes(1);
    expect(props.onStopPointing).toHaveBeenCalled();
  });

  it('opens at once when reached by keyboard', async () => {
    const actor = userEvent.setup();
    const props = draw();

    await actor.tab();

    expect(props.onOpen).toHaveBeenCalledTimes(1);
  });

  it('plays when clicked', async () => {
    const actor = userEvent.setup();
    const props = draw();

    await actor.click(line());

    expect(props.onChoose).toHaveBeenCalledTimes(1);
    expect(props.onOpen).not.toHaveBeenCalled();
  });

  it('opens on the first tap of a touch screen, where there is no pointing, rather than playing', async () => {
    const actor = userEvent.setup();
    const props = draw();

    await actor.pointer({ keys: '[TouchA]', target: line() });

    expect(props.onOpen).toHaveBeenCalledTimes(1);
    expect(props.onChoose).not.toHaveBeenCalled();
  });

  it('plays on a tap once it is open', async () => {
    const actor = userEvent.setup();
    const props = draw({ isOpen: true });

    await actor.pointer({ keys: '[TouchA]', target: line() });

    expect(props.onChoose).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(EpisodeLine.displayName).toBe('EpisodeLine');
  });
});
