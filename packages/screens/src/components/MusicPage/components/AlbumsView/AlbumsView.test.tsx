import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { AlbumsView } from './AlbumsView';

vi.mock('@ValenceScreens/music/theMusicPlayer', () => ({
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

const fetched = vi.fn();

beforeEach(() => {
  const answer = answerMusicRequests({ '/api/music/albums': { albums: [ALBUM] } });

  fetched.mockReset();
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    fetched(input instanceof Request ? input.url : input.toString());

    return answer(input);
  });
});

describe('AlbumsView', () => {
  it('shows every album as a grid', async () => {
    renderInAnAddress(<AlbumsView />);

    expect(await screen.findByRole('region', { name: 'Albums' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Even In Arcadia/ })).toBeInTheDocument();
  });

  it('puts them in another order when asked', async () => {
    renderInAnAddress(<AlbumsView />);

    await userEvent.click(await screen.findByRole('button', { name: 'A–Z' }));

    expect(fetched).toHaveBeenCalledWith(expect.stringContaining('order=title'));
  });

  it('says so where there are none', async () => {
    vi.stubGlobal('fetch', answerMusicRequests({ '/api/music/albums': { albums: [] } }));

    renderInAnAddress(<AlbumsView />);

    expect(await screen.findByText('No albums yet')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AlbumsView.displayName).toBe('AlbumsView');
  });
});
