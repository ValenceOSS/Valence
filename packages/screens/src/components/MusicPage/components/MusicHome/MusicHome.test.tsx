import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { MusicHome } from './MusicHome';

vi.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => aFakeMusicPlayer().player,
}));

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
  addedAt: '2026-09-18T00:00:00.000Z',
};

const PLAYLIST = {
  id: '00000000-0000-4000-8000-00000000d0d0',
  name: 'Sunday morning',
  description: null,
  isShared: false,
  isOrdered: false,
  isMine: true,
  owner: { profileId: '00000000-0000-4000-8000-000000000001', name: 'Dan', colour: '#fff' },
  entryCount: 0,
  lostCount: 0,
  durationSeconds: 0,
  artworkAlbumIds: [],
  updatedAt: '',
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    answerMusicRequests({
      '/api/music/albums': { albums: [ALBUM] },
      '/api/music/artists': { artists: [] },
      '/api/playlists': {
        playlists: [
          PLAYLIST,
          {
            ...PLAYLIST,
            id: '00000000-0000-4000-8000-00000000d0d1',
            name: 'Sam’s mix',
            isMine: false,
          },
        ],
      },
    }),
  );
});

describe('MusicHome', () => {
  it('puts liked songs and your playlists at the top', async () => {
    renderInAnAddress(<MusicHome />);

    const yours = await screen.findByRole('region', { name: 'Your playlists' });

    expect(within(yours).getByRole('button', { name: /Liked Songs/ })).toBeInTheDocument();
    expect(within(yours).getByRole('button', { name: /^Sunday morning/ })).toBeInTheDocument();
  });

  it('shows what was added lately', async () => {
    renderInAnAddress(<MusicHome />);

    expect(await screen.findByRole('region', { name: 'Recently added' })).toBeInTheDocument();
  });

  it('keeps what others shared apart from your own', async () => {
    renderInAnAddress(<MusicHome />);

    expect(await screen.findByRole('region', { name: 'Shared with you' })).toBeInTheDocument();
  });

  it('says there is no music yet where there is none', async () => {
    vi.stubGlobal(
      'fetch',
      answerMusicRequests({
        '/api/music/albums': { albums: [] },
        '/api/music/artists': { artists: [] },
      }),
    );

    renderInAnAddress(<MusicHome />);

    expect(await screen.findByText('No music yet')).toBeInTheDocument();
  });

  it('puts the newest record at the front while nothing is playing', async () => {
    renderInAnAddress(<MusicHome />);

    expect(
      await screen.findByRole('region', { name: 'Newest in your library' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Even In Arcadia' })).toBeInTheDocument();
  });

  it('leads to the whole of each rail', async () => {
    renderInAnAddress(<MusicHome />);

    expect(await screen.findByRole('button', { name: 'See all albums' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'See all playlists' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicHome.displayName).toBe('MusicHome');
  });
});
