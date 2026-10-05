import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { PlaylistView } from './PlaylistView';

vi.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

const held = vi.hoisted(() => ({ profiles: false, music: false }));

vi.mock('@ValenceClient/session/useWhatIMayDo', () => ({
  useWhatIMayDo: () => ({
    may: (permission: string) =>
      (permission === 'account.profiles' && held.profiles) ||
      (permission === 'requests.askMusic' && held.music),
    mayAdminister: held.profiles,
    isLoading: false,
  }),
}));

let fake = aFakeMusicPlayer();

const PLAYLIST_ID = '00000000-0000-4000-8000-00000000d0d0';

const summary = (overrides = {}) => ({
  id: PLAYLIST_ID,
  name: 'Sunday morning',
  description: 'Slow ones',
  isShared: false,
  isOrdered: false,
  isMine: true,
  owner: { profileId: '00000000-0000-4000-8000-000000000001', name: 'Dan', colour: '#3a8ee8' },
  entryCount: 3,
  lostCount: 0,
  missingCount: 0,
  durationSeconds: 7600,
  artworkAlbumIds: [],
  hasOwnArtwork: false,
  updatedAt: '2026-09-18T00:00:00.000Z',
  ...overrides,
});

const entry = (
  n: number,
  track: ReturnType<typeof aTrack> | null,
  title = `Track ${n.toString()}`,
) => ({
  id: `00000000-0000-4000-8000-0000000e${n.toString().padStart(4, '0')}`,
  position: n * 1024,
  addedAt: '2026-09-18T00:00:00.000Z',
  missing: null,
  item: {
    id: track?.id ?? `00000000-0000-4000-8000-0000000f${n.toString().padStart(4, '0')}`,
    kind: track === null ? 'movie' : 'song',
    title,
    subtitle: track === null ? '2016' : 'Sleep Token',
    durationSeconds: 200,
    track,
  },
});

const lostEntry = (n: number) => ({
  id: `00000000-0000-4000-8000-0000000e${n.toString().padStart(4, '0')}`,
  position: n * 1024,
  addedAt: '2026-09-18T00:00:00.000Z',
  missing: null,
  item: null,
});

const missingEntry = (n: number, title: string) => ({
  id: `00000000-0000-4000-8000-0000000e${n.toString().padStart(4, '0')}`,
  position: n * 1024,
  addedAt: '2026-09-18T00:00:00.000Z',
  missing: { title, artist: 'Mara Quill', album: 'Coastal', releaseId: null, coverUrl: null },
  item: null,
});

const ENTRIES = [entry(1, aTrack(1)), entry(2, aTrack(2)), entry(3, null, 'Arrival')];

let requests = answerMusicRequests();

const serve = (
  playlist = summary(),
  entries: (
    | ReturnType<typeof entry>
    | ReturnType<typeof lostEntry>
    | ReturnType<typeof missingEntry>
  )[] = ENTRIES,
) => {
  requests = answerMusicRequests({
    [`/api/playlists/${PLAYLIST_ID}`]: { playlist, entries },
    '/api/requests/availability': { isEnabled: true },
    '/api/requests/catalogue/search': [],
  });
  vi.stubGlobal('fetch', requests);
};

beforeEach(() => {
  fake = aFakeMusicPlayer();
  held.profiles = false;
  held.music = false;
  serve();
});

describe('PlaylistView', () => {
  it('names the playlist and whose it is', async () => {
    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    expect(await screen.findByRole('heading', { name: 'Sunday morning' })).toBeInTheDocument();
    expect(screen.getByText('Dan')).toBeInTheDocument();
    expect(screen.getByText('Slow ones')).toBeInTheDocument();
  });

  it('plays its songs, leaving out what is not music', async () => {
    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Play Sunday morning' }));

    expect(fake.player.play).toHaveBeenCalledWith([aTrack(1), aTrack(2)], 0, {
      source: { kind: 'playlist', id: PLAYLIST_ID, name: 'Sunday morning' },
      isOrdered: false,
    });
  });

  it('lists what is not music below the songs', async () => {
    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    expect(
      await screen.findByRole('region', { name: 'Also in this playlist' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Arrival')).toBeInTheDocument();
  });

  it('will not shuffle a playlist whose order matters, and plays it in order', async () => {
    serve(summary({ isOrdered: true }));

    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    expect(await screen.findByRole('button', { name: 'Shuffle Sunday morning' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Play Sunday morning' }));

    expect(fake.player.play).toHaveBeenCalledWith(
      expect.anything(),
      0,
      expect.objectContaining({ isOrdered: true }),
    );
  });

  it('shares one of yours with the household', async () => {
    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    await userEvent.click(await screen.findByRole('button', { name: 'More for Sunday morning' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Share with the household' }),
    );

    await waitFor(() => {
      expect(requests).toHaveBeenCalledWith(
        `/api/playlists/${PLAYLIST_ID}`,
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ isShared: true }) }),
      );
    });
  });

  it('offers nothing to change on somebody else’s', async () => {
    serve(summary({ isMine: false, isShared: true }));

    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    expect(await screen.findByText('Shared playlist')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'More for Sunday morning' }),
    ).not.toBeInTheDocument();
  });

  it('says a playlist belongs to a profile that is gone rather than leaving the line blank', async () => {
    serve(summary({ isMine: false, isShared: true, owner: null }));

    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    expect(await screen.findByText('A deleted profile')).toBeInTheDocument();
  });

  it('says what a playlist lost with the library it came from', async () => {
    serve(summary(), [entry(1, aTrack(1)), lostEntry(2), lostEntry(3)]);

    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    expect(await screen.findByText('· 2 items no longer in the library')).toBeInTheDocument();
    expect(
      screen.getByText(
        '2 items in this playlist were removed along with the library they came from.',
      ),
    ).toBeInTheDocument();
  });

  it('counts only what is still there beside the ones that are gone', async () => {
    serve(summary(), [entry(1, aTrack(1)), lostEntry(2)]);

    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    expect(await screen.findByText('· 1 song')).toBeInTheDocument();
  });

  it('clears what is gone when its owner asks, an entry at a time', async () => {
    serve(summary(), [entry(1, aTrack(1)), lostEntry(2), lostEntry(3)]);

    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Remove unavailable items from Sunday morning' }),
    );

    await waitFor(() => {
      expect(requests).toHaveBeenCalledWith(
        `/api/playlists/${PLAYLIST_ID}/entries/${lostEntry(2).id}`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  it('does not offer to clear what is gone from somebody else’s playlist', async () => {
    serve(summary({ isMine: false, isShared: true, owner: null }), [
      entry(1, aTrack(1)),
      lostEntry(2),
    ]);

    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    expect(await screen.findByText('No longer in the library')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove unavailable items from Sunday morning' }),
    ).not.toBeInTheDocument();
  });

  it('lets whoever manages profiles clear a playlist nobody owns any more', async () => {
    held.profiles = true;
    serve(summary({ isMine: false, isShared: true, owner: null }));

    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    await userEvent.click(await screen.findByRole('button', { name: 'More for Sunday morning' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete playlist' }));

    expect(
      await screen.findByText(/belonged to a profile that has been deleted/),
    ).toBeInTheDocument();
  });

  it('offers nothing to change on a playlist nobody owns, only to clear it', async () => {
    held.profiles = true;
    serve(summary({ isMine: false, isShared: true, owner: null }));

    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    await userEvent.click(await screen.findByRole('button', { name: 'More for Sunday morning' }));

    expect(await screen.findByRole('menuitem', { name: 'Delete playlist' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Edit details' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Stop sharing' })).not.toBeInTheDocument();
  });

  it('offers nothing at all on a playlist nobody owns to somebody who does not manage profiles', async () => {
    serve(summary({ isMine: false, isShared: true, owner: null }));

    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    expect(await screen.findByText('A deleted profile')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'More for Sunday morning' }),
    ).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PlaylistView.displayName).toBe('PlaylistView');
  });

  it('draws a song the library does not have in its place among the songs, counted apart', async () => {
    serve(summary({ missingCount: 1 }), [
      entry(1, aTrack(1)),
      missingEntry(2, 'Low Tide'),
      entry(3, aTrack(2)),
    ]);
    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    const list = await screen.findByRole('list', { name: 'Sunday morning' });
    const rows = within(list).getAllByRole('listitem');

    expect(
      rows.map((row) => within(row).queryByText(/^(Track \d|Low Tide)$/u)?.textContent),
    ).toEqual(['Track 1', 'Low Tide', 'Track 2']);
    expect(screen.getByText('· 1 song not in your library')).toBeInTheDocument();
    expect(screen.getByText('Mara Quill · Not in your library')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Request the album Low Tide is on' }),
    ).not.toBeInTheDocument();
  });

  it('offers somebody who may ask for music to request its album', async () => {
    held.music = true;
    serve(summary({ missingCount: 1 }), [entry(1, aTrack(1)), missingEntry(2, 'Low Tide')]);
    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Request the album Low Tide is on' }),
    );

    expect(await screen.findByRole('dialog', { name: 'Request its album' })).toBeInTheDocument();
  });

  it('offers to request every missing song’s album at once, only to somebody who may', async () => {
    serve(summary({ missingCount: 1 }), [entry(1, aTrack(1)), missingEntry(2, 'Low Tide')]);

    const { unmount } = renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    await screen.findByText('Low Tide');

    expect(screen.queryByRole('button', { name: 'Request missing songs' })).not.toBeInTheDocument();

    unmount();
    held.music = true;
    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Request missing songs' }));

    expect(
      await screen.findByRole('dialog', { name: 'Request missing songs' }),
    ).toBeInTheDocument();
  });
  it('opens on requesting its missing songs where the notice that their albums were found leads', async () => {
    held.music = true;
    serve(summary({ missingCount: 1 }), [entry(1, aTrack(1)), missingEntry(2, 'Low Tide')]);
    renderInAnAddress(<PlaylistView playlistId={PLAYLIST_ID} isRequestingMissing />);

    expect(
      await screen.findByRole('dialog', { name: 'Request missing songs' }),
    ).toBeInTheDocument();
  });
});
