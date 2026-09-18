import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { AlbumView } from './AlbumView';

vi.mock('@ValenceScreens/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

const ALBUM_ID = '00000000-0000-4000-8000-00000000a1b1';

const ALBUM = {
  id: ALBUM_ID,
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: 'Even In Arcadia',
  artist: { id: '00000000-0000-4000-8000-00000000a7a7', name: 'Sleep Token' },
  year: 2025,
  genres: ['Pop', 'Rock'],
  hasArtwork: false,
  isCompilation: false,
  trackCount: 2,
  durationSeconds: 403,
  addedAt: '2026-09-18T00:00:00.000Z',
};

const TRACKS = [aTrack(1), aTrack(2)];

beforeEach(() => {
  fake = aFakeMusicPlayer();
  vi.stubGlobal(
    'fetch',
    answerMusicRequests({ [`/api/music/albums/${ALBUM_ID}`]: { album: ALBUM, tracks: TRACKS } }),
  );
});

describe('AlbumView', () => {
  it('names the album, who it is by and when', async () => {
    renderInAnAddress(<AlbumView albumId={ALBUM_ID} />);

    expect(await screen.findByRole('heading', { name: 'Even In Arcadia' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Sleep Token' }).length).toBeGreaterThan(0);
    expect(screen.getByText('· 2025')).toBeInTheDocument();
    expect(screen.getByText('· 2 songs')).toBeInTheDocument();
  });

  it('says how much room the album takes, and marks it explicit where its songs are', async () => {
    vi.stubGlobal(
      'fetch',
      answerMusicRequests({
        [`/api/music/albums/${ALBUM_ID}`]: {
          album: { ...ALBUM, sizeBytes: 1_500_000_000, isExplicit: true },
          tracks: [aTrack(1, { isExplicit: true })],
        },
      }),
    );

    renderInAnAddress(<AlbumView albumId={ALBUM_ID} />);

    expect(await screen.findByText('· 1.4 GB')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Explicit' })).toHaveLength(2);
  });

  it('plays the album from the top', async () => {
    renderInAnAddress(<AlbumView albumId={ALBUM_ID} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Play Even In Arcadia' }));

    expect(fake.player.play).toHaveBeenCalledWith(TRACKS, 0, {
      source: { kind: 'album', id: ALBUM_ID, name: 'Even In Arcadia' },
    });
  });

  it('plays the album from the song pressed', async () => {
    renderInAnAddress(<AlbumView albumId={ALBUM_ID} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Track 2' }));

    expect(fake.player.play).toHaveBeenCalledWith(TRACKS, 1, expect.anything());
  });

  it('shuffles the album', async () => {
    renderInAnAddress(<AlbumView albumId={ALBUM_ID} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Shuffle Even In Arcadia' }));

    expect(fake.player.play).toHaveBeenCalledWith(
      TRACKS,
      expect.any(Number),
      expect.objectContaining({ isShuffled: true }),
    );
  });

  it('says so where the album could not be read', async () => {
    vi.stubGlobal('fetch', answerMusicRequests());

    renderInAnAddress(<AlbumView albumId={ALBUM_ID} />);

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AlbumView.displayName).toBe('AlbumView');
  });
});
