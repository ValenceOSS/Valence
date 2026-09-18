import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { PlaylistsView } from './PlaylistsView';

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

describe('PlaylistsView', () => {
  it('shows liked songs at the front of your playlists', async () => {
    vi.stubGlobal('fetch', answerMusicRequests({ '/api/playlists': { playlists: [PLAYLIST] } }));

    renderInAnAddress(<PlaylistsView />);

    const yours = await screen.findByRole('region', { name: 'Playlists' });

    expect(within(yours).getByRole('button', { name: /^Liked Songs/ })).toBeInTheDocument();
    expect(within(yours).getByRole('button', { name: /^Sunday morning/ })).toBeInTheDocument();
  });

  it('starts a new playlist', async () => {
    vi.stubGlobal('fetch', answerMusicRequests({}));

    renderInAnAddress(<PlaylistsView />);

    await userEvent.click(await screen.findByRole('button', { name: 'New playlist' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PlaylistsView.displayName).toBe('PlaylistsView');
  });
});
