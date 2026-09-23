import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { AlbumShelf } from './AlbumShelf';

vi.mock('@ValenceScreens/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

const ALBUM = {
  id: '00000000-0000-4000-8000-00000000a1b1',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: 'Even In Arcadia',
  artist: { id: '00000000-0000-4000-8000-00000000a7a7', name: 'Sleep Token' },
  year: 2025,
  genres: [],
  hasArtwork: false,
  isCompilation: false,
  trackCount: 1,
  durationSeconds: 201,
  sizeBytes: 0,
  isExplicit: false,
  addedAt: '2026-09-18T00:00:00.000Z',
};

beforeEach(() => {
  fake = aFakeMusicPlayer();
  vi.stubGlobal(
    'fetch',
    answerMusicRequests({
      [`/api/music/albums/${ALBUM.id}`]: { album: ALBUM, tracks: [aTrack(1)] },
    }),
  );
});

describe('AlbumShelf', () => {
  it('draws nothing where there are no albums', () => {
    const { container } = renderInAnAddress(<AlbumShelf heading="Albums" albums={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('names each album with who it is by and when', () => {
    renderInAnAddress(<AlbumShelf heading="Recently added" albums={[ALBUM]} />);

    expect(screen.getByRole('region', { name: 'Recently added' })).toBeInTheDocument();
    expect(screen.getByText('2025 · Sleep Token')).toBeInTheDocument();
  });

  it('plays an album straight from the shelf', async () => {
    renderInAnAddress(<AlbumShelf heading="Albums" albums={[ALBUM]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Play Even In Arcadia' }));

    await waitFor(() => {
      expect(fake.player.play).toHaveBeenCalledWith([aTrack(1)], 0, expect.anything());
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AlbumShelf.displayName).toBe('AlbumShelf');
  });
});
