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
  missingCount: 0,
  durationSeconds: 0,
  artworkAlbumIds: [],
  hasOwnArtwork: false,
  isSmart: false,
  rules: null,
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
  it('lists your playlists in a shelf of their own', async () => {
    renderInAnAddress(<MusicHome />);

    const yours = await screen.findByRole('region', { name: 'Your playlists' });

    expect(within(yours).getByRole('button', { name: /^Sunday morning/ })).toBeInTheDocument();
  });

  it('puts the mixes of the genres and decades played among your top mixes', async () => {
    vi.stubGlobal(
      'fetch',
      answerMusicRequests({
        '/api/music/albums': { albums: [ALBUM] },
        '/api/music/artists': { artists: [] },
        '/api/music/mixes': {
          mixes: [
            {
              id: 'genre-rock',
              kind: 'genre',
              title: 'Rock Mix',
              detail: 'Rock from your library',
              trackCount: 20,
              coverAlbumIds: [],
              faces: [],
            },
          ],
        },
      }),
    );

    renderInAnAddress(<MusicHome />);

    const made = await screen.findByRole('region', { name: 'Your top mixes' });

    expect(within(made).getByRole('button', { name: /^Rock Mix/ })).toBeInTheDocument();
  });

  it('leads with what was added last', async () => {
    renderInAnAddress(<MusicHome />);

    expect(
      await screen.findByRole('region', { name: 'Newest in your library' }),
    ).toBeInTheDocument();
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

  it('leads to the whole of your playlists', async () => {
    renderInAnAddress(<MusicHome />);

    expect(await screen.findByRole('button', { name: 'See all playlists' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicHome.displayName).toBe('MusicHome');
  });
});
