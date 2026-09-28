import { screen } from '@testing-library/react';
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

const answer = (overview: string | null) =>
  answerMusicRequests({
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

describe('PausedScreen', () => {
  it('says which programme, season and episode is paused, and what happens in it', async () => {
    renderInAnAddress(<PausedScreen media={EPISODE} isShown />);

    expect(screen.getByText('You’re watching')).toBeInTheDocument();
    expect(screen.getByText('The Dangers in My Heart')).toBeInTheDocument();
    expect(screen.getByText('Season 2')).toBeInTheDocument();
    expect(screen.getByText('We’ve Been Searching: Ep. 2')).toBeInTheDocument();
    expect(await screen.findByText('Kyotaro panics in class.')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
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
});
