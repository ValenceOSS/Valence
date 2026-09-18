import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { TrackList } from './TrackList';

const favourites = vi.hoisted(() => ({
  fetchFavourites: vi.fn(),
  setFavourite: vi.fn(),
}));

vi.mock('@ValenceClient/library/fetchFavourites', () => favourites);

vi.mock('@ValenceClient/profiles/fetchProfiles', () => ({
  fetchProfiles: () =>
    Promise.resolve([
      {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Dan',
        colour: '#3a8ee8',
        avatar: { kind: 'initial' },
        askStillWatchingAfter: 4,
        showsWhatIamWatching: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]),
}));

vi.mock('@ValenceClient/music/fetchPlaylists', () => ({
  fetchPlaylists: () => Promise.resolve([]),
  addToPlaylist: vi.fn(),
  createPlaylist: vi.fn(),
}));

vi.mock('@ValenceScreens/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

const TRACKS = [
  aTrack(1),
  aTrack(2, {
    artists: [
      { id: '00000000-0000-4000-8000-00000000a7a7', name: 'Sleep Token' },
      { id: '00000000-0000-4000-8000-00000000b8b8', name: 'Guest' },
    ],
  }),
  aTrack(3, { isLossless: false }),
];

beforeEach(() => {
  fake = aFakeMusicPlayer();
  favourites.fetchFavourites.mockResolvedValue([TRACKS[0]?.id]);
  favourites.setFavourite.mockResolvedValue(true);
});

describe('TrackList', () => {
  it('lays one background under whichever row the pointer is over', () => {
    renderInAnAddress(<TrackList label="Even In Arcadia" tracks={TRACKS} onPlay={vi.fn()} />);

    const row = within(screen.getByRole('list', { name: 'Even In Arcadia' })).getAllByRole(
      'listitem',
    )[1];

    expect(row).toHaveAttribute('data-highlight');

    if (row !== undefined) {
      fireEvent.pointerMove(row);
    }

    expect(document.querySelector('.bg-\\[var\\(--surface-hover\\)\\]')).toBeInTheDocument();
  });

  it('lists every song, named for anybody not looking at it', () => {
    renderInAnAddress(<TrackList label="Even In Arcadia" tracks={TRACKS} onPlay={vi.fn()} />);

    const list = screen.getByRole('list', { name: 'Even In Arcadia' });

    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('plays the list from the song whose title was pressed', async () => {
    const onPlay = vi.fn();

    renderInAnAddress(<TrackList label="Album" tracks={TRACKS} onPlay={onPlay} />);

    await userEvent.click(screen.getByRole('button', { name: 'Track 2' }));

    expect(onPlay).toHaveBeenCalledWith(1);
  });

  it('plays from a song with its own play button', async () => {
    const onPlay = vi.fn();

    renderInAnAddress(<TrackList label="Album" tracks={TRACKS} onPlay={onPlay} />);

    await userEvent.click(screen.getByRole('button', { name: 'Play Track 3' }));

    expect(onPlay).toHaveBeenCalledWith(2);
  });

  it('names every artist a song credits', () => {
    renderInAnAddress(<TrackList label="Album" tracks={TRACKS} onPlay={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Guest' })).toBeInTheDocument();
  });

  it('says which songs are lossless', () => {
    renderInAnAddress(<TrackList label="Album" tracks={TRACKS} onPlay={vi.fn()} />);

    expect(screen.getAllByText('Lossless')).toHaveLength(2);
  });

  it('shows which songs you like, and likes another in one press', async () => {
    renderInAnAddress(<TrackList label="Album" tracks={TRACKS} onPlay={vi.fn()} />);

    expect(await screen.findByRole('button', { name: 'Unlike Track 1' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Like Track 2' }));

    await waitFor(() => {
      expect(favourites.setFavourite).toHaveBeenCalledWith(TRACKS[1]?.id, true);
    });
  });

  it('numbers songs by their place on the album where asked', () => {
    renderInAnAddress(
      <TrackList label="Album" tracks={[aTrack(7)]} onPlay={vi.fn()} numbering="track" />,
    );

    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('leaves the album out on the album’s own page', () => {
    renderInAnAddress(
      <TrackList label="Album" tracks={TRACKS} onPlay={vi.fn()} showsAlbum={false} />,
    );

    expect(screen.queryByRole('button', { name: 'Even In Arcadia' })).not.toBeInTheDocument();
  });

  it('marks the song playing', () => {
    fake = aFakeMusicPlayer({ current: TRACKS[1] ?? null, isPlaying: true });

    renderInAnAddress(<TrackList label="Album" tracks={TRACKS} onPlay={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Track 2' })).toHaveClass('font-bold');
  });

  it('offers to pause the song playing rather than to start it again', async () => {
    fake = aFakeMusicPlayer({ current: TRACKS[1] ?? null, isPlaying: true });

    const onPlay = vi.fn();

    renderInAnAddress(<TrackList label="Album" tracks={TRACKS} onPlay={onPlay} />);

    await userEvent.click(screen.getByRole('button', { name: 'Pause Track 2' }));

    expect(fake.player.pause).toHaveBeenCalled();
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('keeps the bars beside the song playing once it has been pressed', async () => {
    fake = aFakeMusicPlayer({ current: TRACKS[1] ?? null, isPlaying: true });

    renderInAnAddress(<TrackList label="Album" tracks={TRACKS} onPlay={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Track 2' }));

    expect(screen.getByRole('img', { name: 'Playing' }).parentElement).not.toHaveClass(
      'group-focus-within:opacity-0',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TrackList.displayName).toBe('TrackList');
  });
});
