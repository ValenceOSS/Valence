import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { MusicSearchView } from './MusicSearchView';

vi.mock('@ValenceScreens/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

beforeEach(() => {
  fake = aFakeMusicPlayer();
  vi.stubGlobal(
    'fetch',
    answerMusicRequests({
      '/api/music/search?q=caramel': {
        tracks: [aTrack(5, { title: 'Caramel' })],
        albums: [],
        artists: [],
        playlists: [],
      },
      '/api/music/search?q=zzz': { tracks: [], albums: [], artists: [], playlists: [] },
      '/api/music/albums': { albums: [] },
    }),
  );
});

describe('MusicSearchView', () => {
  it('lists the songs that match, and plays one', async () => {
    renderInAnAddress(<MusicSearchView query="caramel" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Caramel' }));

    expect(fake.player.play).toHaveBeenCalledWith([aTrack(5, { title: 'Caramel' })], 0, {
      source: { kind: 'search', id: null, name: '“caramel”' },
    });
  });

  it('says so where nothing matches', async () => {
    renderInAnAddress(<MusicSearchView query="zzz" />);

    expect(await screen.findByText('Nothing matches “zzz”')).toBeInTheDocument();
  });

  it('keeps what was typed in the box', async () => {
    renderInAnAddress(<MusicSearchView query="" />);

    const box = screen.getByRole('searchbox', { name: 'Search music' });

    await userEvent.type(box, 'sleep');

    await waitFor(() => {
      expect(box).toHaveValue('sleep');
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicSearchView.displayName).toBe('MusicSearchView');
  });
});
