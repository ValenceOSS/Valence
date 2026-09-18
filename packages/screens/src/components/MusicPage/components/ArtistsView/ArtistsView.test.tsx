import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { ArtistsView } from './ArtistsView';

const ARTIST = {
  id: '00000000-0000-4000-8000-00000000a7a7',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  name: 'Sleep Token',
  hasImage: false,
  imageAlbumId: null,
  albumCount: 1,
  trackCount: 10,
  isFavourite: false,
};

describe('ArtistsView', () => {
  it('shows every artist as a grid', async () => {
    vi.stubGlobal('fetch', answerMusicRequests({ '/api/music/artists': { artists: [ARTIST] } }));

    renderInAnAddress(<ArtistsView />);

    expect(await screen.findByRole('region', { name: 'Artists' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sleep Token/ })).toBeInTheDocument();
  });

  it('says how to follow somebody where nobody is followed', async () => {
    vi.stubGlobal('fetch', answerMusicRequests({ '/api/music/artists': { artists: [] } }));

    renderInAnAddress(<ArtistsView />);

    await userEvent.click(await screen.findByRole('button', { name: 'Following' }));

    expect(await screen.findByText('Not following anybody yet')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ArtistsView.displayName).toBe('ArtistsView');
  });
});
