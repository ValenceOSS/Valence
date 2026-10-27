import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PlaylistDialog } from './PlaylistDialog';

const playlists = vi.hoisted(() => ({
  createPlaylist: vi.fn(),
  updatePlaylist: vi.fn(),
  fetchPlaylists: vi.fn(),
}));

vi.mock('@ValenceClient/music/fetchPlaylists', () => playlists);

vi.mock('@ValenceClient/music/fetchMusicGenres', () => ({
  fetchMusicGenres: () => Promise.resolve(['Indie']),
}));

const SUMMARY = {
  id: '00000000-0000-4000-8000-00000000d0d0',
  name: 'Sunday morning',
  description: null,
  isShared: false,
  isOrdered: false,
  isMine: true,
  owner: { profileId: 'p', name: 'Dan', colour: '#fff' },
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
  playlists.createPlaylist.mockReset();
  playlists.updatePlaylist.mockReset();
  playlists.createPlaylist.mockResolvedValue(SUMMARY);
  playlists.updatePlaylist.mockResolvedValue(true);
});

describe('PlaylistDialog', () => {
  it('makes a playlist with a name, and says which it made', async () => {
    const onSaved = vi.fn();

    renderInAnAddress(<PlaylistDialog isOpen onClose={vi.fn()} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Sunday morning');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(SUMMARY.id);
    });
    expect(playlists.createPlaylist).toHaveBeenCalledWith({
      name: 'Sunday morning',
      description: null,
      isOrdered: false,
    });
  });

  it('will not make a playlist with no name', async () => {
    renderInAnAddress(<PlaylistDialog isOpen onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('A playlist needs a name.')).toBeInTheDocument();
    expect(playlists.createPlaylist).not.toHaveBeenCalled();
  });

  it('marks a playlist whose order matters', async () => {
    renderInAnAddress(<PlaylistDialog isOpen onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Chapters');
    await userEvent.click(screen.getByRole('switch', { name: 'The order matters' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(playlists.createPlaylist).toHaveBeenCalledWith(
        expect.objectContaining({ isOrdered: true }),
      );
    });
  });

  it('changes a playlist that is already there', async () => {
    renderInAnAddress(<PlaylistDialog isOpen onClose={vi.fn()} playlist={SUMMARY} />);

    const name = screen.getByLabelText('Name');

    await userEvent.clear(name);
    await userEvent.type(name, 'Late night');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(playlists.updatePlaylist).toHaveBeenCalledWith(SUMMARY.id, {
        name: 'Late night',
        description: null,
        isOrdered: false,
      });
    });
  });

  it('says so where the server would not take it', async () => {
    playlists.createPlaylist.mockResolvedValue(null);

    renderInAnAddress(<PlaylistDialog isOpen onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Name'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Couldn’t create the playlist.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PlaylistDialog.displayName).toBe('PlaylistDialog');
  });

  it('makes a smart playlist from its rules, fifty shuffled songs to begin with', async () => {
    renderInAnAddress(<PlaylistDialog isOpen isSmart onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'New smart playlist' })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'The order matters' })).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Name'), 'Liked');
    await userEvent.click(screen.getByRole('button', { name: 'Add a rule' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(playlists.createPlaylist).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Liked',
          rules: { rules: [{ kind: 'liked', is: true }], order: 'random', limit: 50 },
        }),
      );
    });
  });

  it('will not make a smart playlist while it holds more than it may', async () => {
    renderInAnAddress(<PlaylistDialog isOpen isSmart onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Everything');
    await userEvent.clear(screen.getByLabelText('Limit'));
    await userEvent.type(screen.getByLabelText('Limit'), '5000');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('A whole number from 1 to 1,000, or leave it empty.'),
    ).toBeInTheDocument();
    expect(playlists.createPlaylist).not.toHaveBeenCalled();
  });

  it('changes a smart playlist’s rules', async () => {
    renderInAnAddress(
      <PlaylistDialog
        isOpen
        onClose={vi.fn()}
        playlist={{
          ...SUMMARY,
          isSmart: true,
          rules: { rules: [{ kind: 'liked', is: true }], order: 'random', limit: 50 },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Edit smart playlist' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remove this rule' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(playlists.updatePlaylist).toHaveBeenCalledWith(
        SUMMARY.id,
        expect.objectContaining({ rules: { rules: [], order: 'random', limit: 50 } }),
      );
    });
  });

  it('leaves alone rules made by a newer version, saying so', async () => {
    renderInAnAddress(
      <PlaylistDialog
        isOpen
        onClose={vi.fn()}
        playlist={{ ...SUMMARY, isSmart: true, rules: null }}
      />,
    );

    expect(
      screen.getByText(
        'These rules were made by a newer version of Valence, so they can only be changed there.',
      ),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(playlists.updatePlaylist).toHaveBeenCalledWith(SUMMARY.id, {
        name: 'Sunday morning',
        description: null,
        isOrdered: false,
      });
    });
  });
});
