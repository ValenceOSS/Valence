import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { PlaylistShelf, describePlaylist } from './PlaylistShelf';

vi.mock('@ValenceScreens/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

const PLAYLIST = {
  id: '00000000-0000-4000-8000-00000000d0d0',
  name: 'Sunday morning',
  description: null,
  isShared: true,
  isOrdered: true,
  isMine: false,
  owner: { profileId: '00000000-0000-4000-8000-000000000002', name: 'Sam', colour: '#fff' },
  entryCount: 1,
  lostCount: 0,
  durationSeconds: 201,
  artworkAlbumIds: [],
  updatedAt: '',
};

beforeEach(() => {
  fake = aFakeMusicPlayer();
  vi.stubGlobal(
    'fetch',
    answerMusicRequests({
      [`/api/playlists/${PLAYLIST.id}`]: {
        playlist: PLAYLIST,
        entries: [
          {
            id: '00000000-0000-4000-8000-00000000e001',
            position: 1024,
            addedAt: '',
            item: {
              id: aTrack(1).id,
              kind: 'song',
              title: 'Track 1',
              subtitle: null,
              durationSeconds: 201,
              track: aTrack(1),
            },
          },
        ],
      },
    }),
  );
});

describe('PlaylistShelf', () => {
  it('draws nothing where there are no playlists', () => {
    const { container } = renderInAnAddress(<PlaylistShelf heading="Playlists" playlists={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('says whose somebody else’s playlist is', () => {
    expect(describePlaylist(PLAYLIST)).toBe('By Sam · 1 thing');
    expect(describePlaylist({ ...PLAYLIST, isMine: true, entryCount: 4 })).toBe('4 things');
  });

  it('says a shared playlist belongs to a removed profile once its owner is gone', () => {
    expect(describePlaylist({ ...PLAYLIST, owner: null })).toBe('By a removed profile · 1 thing');
  });

  it('plays a playlist straight from the shelf, keeping its order where it matters', async () => {
    renderInAnAddress(<PlaylistShelf heading="Shared with you" playlists={[PLAYLIST]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Play Sunday morning' }));

    await waitFor(() => {
      expect(fake.player.play).toHaveBeenCalledWith(
        [aTrack(1)],
        0,
        expect.objectContaining({ isOrdered: true }),
      );
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PlaylistShelf.displayName).toBe('PlaylistShelf');
  });
});
