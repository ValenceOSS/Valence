import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { MusicLibrary, isSameView } from './MusicLibrary';

vi.mock('@ValenceScreens/music/theMusicPlayer', () => ({
  theMusicPlayer: () => aFakeMusicPlayer().player,
}));

const PLAYLIST = {
  id: '00000000-0000-4000-8000-00000000d0d0',
  name: 'Sunday morning',
  description: null,
  isShared: false,
  isOrdered: false,
  isMine: true,
  owner: { profileId: '00000000-0000-4000-8000-000000000001', name: 'Dan', colour: '#fff' },
  entryCount: 0,
  durationSeconds: 0,
  artworkAlbumIds: [],
  updatedAt: '',
};

const ALBUM = {
  id: '00000000-0000-4000-8000-00000000a1b1',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: 'Even In Arcadia',
  artist: { id: '00000000-0000-4000-8000-00000000a7a7', name: 'Sleep Token' },
  year: 2025,
  genres: [],
  hasArtwork: false,
  isCompilation: false,
  trackCount: 10,
  durationSeconds: 3000,
  addedAt: '',
};

const ARTIST = {
  id: '00000000-0000-4000-8000-00000000a7a7',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  name: 'Sleep Token',
  hasImage: false,
  imageAlbumId: null,
  albumCount: 1,
  trackCount: 10,
  isFavourite: true,
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    answerMusicRequests({
      '/api/playlists': { playlists: [PLAYLIST] },
      '/api/music/artists?favourites=true': { artists: [ARTIST] },
      '/api/music/albums': { albums: [ALBUM] },
    }),
  );
});

describe('MusicLibrary', () => {
  it('lists liked songs, playlists, followed artists and albums', async () => {
    renderInAnAddress(<MusicLibrary />);

    expect(await screen.findByRole('button', { name: /Sunday morning/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Liked Songs/ })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Artist$/ })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Even In Arcadia/ })).toBeInTheDocument();
  });

  it('shows only one kind when a chip is chosen, and all again when it is pressed again', async () => {
    renderInAnAddress(<MusicLibrary />);

    await screen.findByRole('button', { name: /Even In Arcadia/ });
    await userEvent.click(screen.getByRole('button', { name: 'Albums' }));

    expect(screen.queryByRole('button', { name: /Sunday morning/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Even In Arcadia/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Albums' }));

    expect(screen.getByRole('button', { name: /Sunday morning/ })).toBeInTheDocument();
  });

  it('narrows the list by name', async () => {
    renderInAnAddress(<MusicLibrary />);

    await screen.findByRole('button', { name: /Sunday morning/ });
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Find in your library' }),
      'arcadia',
    );

    expect(screen.queryByRole('button', { name: /Sunday morning/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Even In Arcadia/ })).toBeInTheDocument();
  });

  it('opens a new playlist', async () => {
    renderInAnAddress(<MusicLibrary />);

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('dialog', { name: 'New playlist' })).toBeInTheDocument();
  });

  it('tells one page of the music section from another', () => {
    expect(isSameView({ kind: 'liked' }, { kind: 'liked' })).toBe(true);
    expect(isSameView({ kind: 'album', id: 'a' }, { kind: 'album', id: 'b' })).toBe(false);
    expect(isSameView({ kind: 'album', id: 'a' }, { kind: 'artist', id: 'a' })).toBe(false);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicLibrary.displayName).toBe('MusicLibrary');
  });
});
