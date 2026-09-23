import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { ArtistView } from './ArtistView';

vi.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

const ARTIST_ID = '00000000-0000-4000-8000-00000000a7a7';

const ARTIST = {
  id: ARTIST_ID,
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  name: 'Sleep Token',
  hasImage: false,
  imageAlbumId: null,
  albumCount: 1,
  trackCount: 10,
  isFavourite: false,
};

const ALBUM = {
  id: '00000000-0000-4000-8000-00000000a1b1',
  libraryId: ARTIST.libraryId,
  title: 'Even In Arcadia',
  artist: { id: ARTIST_ID, name: 'Sleep Token' },
  year: 2025,
  genres: [],
  hasArtwork: false,
  isCompilation: false,
  trackCount: 10,
  durationSeconds: 3000,
  addedAt: '2026-09-18T00:00:00.000Z',
};

const POPULAR = [aTrack(1), aTrack(2)];

let requests = answerMusicRequests();

beforeEach(() => {
  fake = aFakeMusicPlayer();
  requests = answerMusicRequests({
    [`/api/music/artists/${ARTIST_ID}`]: {
      artist: ARTIST,
      albums: [ALBUM],
      appearsOn: [],
      popular: POPULAR,
    },
  });
  vi.stubGlobal('fetch', requests);
});

describe('ArtistView', () => {
  it('names the artist and how much of theirs there is', async () => {
    renderInAnAddress(<ArtistView artistId={ARTIST_ID} />);

    expect(await screen.findByRole('heading', { name: 'Sleep Token' })).toBeInTheDocument();
    expect(screen.getByText(/1 album/)).toBeInTheDocument();
  });

  it('lists their songs and their albums', async () => {
    renderInAnAddress(<ArtistView artistId={ARTIST_ID} />);

    expect(await screen.findByRole('list', { name: 'Songs by Sleep Token' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Albums' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Appears on' })).not.toBeInTheDocument();
  });

  it('plays their songs', async () => {
    renderInAnAddress(<ArtistView artistId={ARTIST_ID} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Play Sleep Token' }));

    expect(fake.player.play).toHaveBeenCalledWith(POPULAR, 0, expect.anything());
  });

  it('follows them', async () => {
    renderInAnAddress(<ArtistView artistId={ARTIST_ID} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Follow' }));

    expect(await screen.findByRole('button', { name: 'Following' })).toBeInTheDocument();
    await waitFor(() => {
      expect(requests).toHaveBeenCalledWith(
        `/api/music/artists/${ARTIST_ID}/favourite`,
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ArtistView.displayName).toBe('ArtistView');
  });
});
