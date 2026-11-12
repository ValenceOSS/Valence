import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { PausedScreen } from './PausedScreen';

const EPISODE = {
  id: '9c858901-8a57-4791-81fe-4c455b099bc9',
  title: 'We’ve Been Searching',
  seriesTitle: 'The Dangers in My Heart',
  seasonNumber: 2,
  episodeNumber: 2,
};

const NEXT = {
  ...EPISODE,
  id: '9c858901-8a57-4791-81fe-4c455b099bc0',
  title: 'The Next One',
  episodeNumber: 3,
};

/**
 * What the server says about an episode, with what happens in it.
 *
 * @param id - Which episode.
 * @param title - What it is called.
 * @param overview - What happens in it.
 * @returns Its details.
 */
const detailOf = (id: string, title: string, overview: string | null) => ({
  id,
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title,
  year: 2024,
  container: 'mkv',
  durationSeconds: 1440,
  videoCodec: 'hevc',
  videoBitDepth: 10,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 1920,
  height: 1080,
  videoRange: 'SDR',
  bitrateKbps: 6000,
  audioStreams: [{ index: 1, codec: 'aac', channels: 2, isDefault: true, isAtmos: false }],
  subtitleStreams: [],
  addedAt: '2026-09-01T00:00:00.000Z',
  metadata: { hasPoster: false, hasBackdrop: false, hasLogo: false, overview },
});

const answer = (overview: string | null) =>
  answerMusicRequests({
    [`/api/media/${NEXT.id}`]: detailOf(NEXT.id, NEXT.title, 'The class goes on a trip.'),
    [`/api/media/${EPISODE.id}`]: {
      id: EPISODE.id,
      libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
      title: EPISODE.title,
      year: 2024,
      container: 'mkv',
      durationSeconds: 1440,
      videoCodec: 'hevc',
      videoBitDepth: 10,
      canCopySegments: true,
      videoIsInterlaced: false,
      width: 1920,
      height: 1080,
      videoRange: 'SDR',
      bitrateKbps: 6000,
      audioStreams: [{ index: 1, codec: 'aac', channels: 2, isDefault: true, isAtmos: false }],
      subtitleStreams: [],
      addedAt: '2026-09-01T00:00:00.000Z',
      metadata: { hasPoster: false, hasBackdrop: false, hasLogo: false, overview },
    },
  });

beforeEach(() => {
  vi.stubGlobal('fetch', answer('Kyotaro panics in class.'));
});

/**
 * Finds the line that says the season and the episode, which holds both in one.
 *
 * @param parts - What the line says, in pieces.
 * @returns The line.
 */
const theLineSaying = (...parts: string[]) =>
  screen.getByText(
    (_, element) =>
      element?.tagName === 'P' && parts.every((part) => element.textContent.includes(part)),
  );

describe('PausedScreen', () => {
  it('says which programme, season and episode is paused, and what happens in it', async () => {
    renderInAnAddress(<PausedScreen media={EPISODE} isShown />);

    expect(screen.getByText('The Dangers in My Heart')).toBeInTheDocument();
    expect(theLineSaying('Season 2', 'We’ve Been Searching: Ep. 2')).toBeInTheDocument();
    expect(await screen.findByText('Kyotaro panics in class.')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('asks whether anybody is still watching, naming the episode up next, until answered', async () => {
    const onCarryOn = vi.fn();
    const onStop = vi.fn();

    renderInAnAddress(
      <PausedScreen media={EPISODE} isShown={false} asking={{ upNext: NEXT, onCarryOn, onStop }} />,
    );

    expect(screen.getByText('Are you still watching?')).toBeInTheDocument();
    expect(screen.queryByText('You’re watching')).not.toBeInTheDocument();
    expect(screen.getByText('The Dangers in My Heart')).toBeInTheDocument();
    expect(theLineSaying('Up next: The Next One: Ep. 3')).toBeInTheDocument();
    expect(await screen.findByText('The class goes on a trip.')).toBeInTheDocument();
    expect(screen.queryByText('Paused')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue watching' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Continue watching' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(onCarryOn).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('says how much is left to watch, but not while asking whether anybody is still watching', () => {
    const { unmount } = renderInAnAddress(
      <PausedScreen media={EPISODE} isShown secondsLeft={600} />,
    );

    expect(screen.getByText(/left$/)).toBeInTheDocument();

    unmount();
    renderInAnAddress(
      <PausedScreen
        media={EPISODE}
        isShown
        secondsLeft={600}
        asking={{ upNext: NEXT, onCarryOn: vi.fn(), onStop: vi.fn() }}
      />,
    );

    expect(screen.queryByText(/left$/)).not.toBeInTheDocument();
  });

  it('names a film by itself, with no season or episode', () => {
    renderInAnAddress(<PausedScreen media={{ id: EPISODE.id, title: 'Arrival' }} isShown />);

    expect(screen.getByText('Arrival')).toBeInTheDocument();
    expect(screen.queryByText(/Season/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ep\./)).not.toBeInTheDocument();
  });

  it('shows nothing, and asks for nothing, until it has been left long enough', () => {
    const requests = answer(null);

    vi.stubGlobal('fetch', requests);

    renderInAnAddress(<PausedScreen media={EPISODE} isShown={false} />);

    expect(screen.queryByText('Paused')).not.toBeInTheDocument();
    expect(requests).not.toHaveBeenCalled();
  });

  it('names the programme by its logo where it has one', () => {
    renderInAnAddress(<PausedScreen media={{ ...EPISODE, hasLogo: true }} isShown />);

    expect(screen.getByRole('img', { name: 'The Dangers in My Heart' })).toHaveAttribute(
      'src',
      expect.stringContaining(`/api/media/${EPISODE.id}/image/logo`),
    );
    expect(theLineSaying('Season 2')).toBeInTheDocument();
  });

  it('names the programme in type where its logo will not load', () => {
    renderInAnAddress(<PausedScreen media={{ ...EPISODE, hasLogo: true }} isShown />);

    fireEvent.error(screen.getByRole('img', { name: 'The Dangers in My Heart' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('The Dangers in My Heart')).toBeInTheDocument();
  });
});
