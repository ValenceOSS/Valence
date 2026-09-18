import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Add01Icon, FavouriteIcon, Search01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { ContextMenu } from '@ValenceUI/ContextMenu';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { cn } from '@ValenceUI/cn';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { pictureOf } from '@ValenceScreens/components/ArtistShelf/ArtistShelf';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { PlaylistCover } from '@ValenceScreens/components/PlaylistCover/PlaylistCover';
import { PlaylistDialog } from '@ValenceScreens/components/PlaylistDialog/PlaylistDialog';
import { Equaliser } from '@ValenceScreens/components/Equaliser/Equaliser';
import { isPlayingFrom } from '@ValenceScreens/music/isPlayingFrom';
import { musicMenuFor } from '@ValenceScreens/music/musicMenuFor';
import { nameOfOwner } from '@ValenceScreens/music/nameOfOwner';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import type { ReactNode } from 'react';
import type { MusicView } from '@ValenceScreens/music/musicView';

type Shelf = 'playlists' | 'albums' | 'artists';

type Entry = {
  key: string;
  shelf: Shelf | 'liked';
  name: string;
  detail: string;
  artwork: ReactNode;
  view: MusicView;
};

const SHELVES: readonly { id: Shelf; label: string }[] = [
  { id: 'playlists', label: 'Playlists' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
];

/**
 * Whether two views of the music section are the same page, so the one showing can be marked.
 *
 * @param left - One view.
 * @param right - The other.
 * @returns Whether they are the same page.
 */
const isSameView = (left: MusicView, right: MusicView): boolean =>
  left.kind === right.kind && ('id' in left ? left.id : null) === ('id' in right ? right.id : null);

/**
 * The column down the side of the music section: liked songs, every playlist this person can play,
 * the artists they follow and the albums in the library — narrowed to one kind by a chip, or by
 * name from the box — with a button to make a new playlist at the top.
 */
const MusicLibrary = () => {
  const { view, open } = useMusicNavigation();
  const { state, player } = useMusicPlayer();
  const { containerRef, rect, follow, clear } = useSlidingHighlight();
  const [shelf, setShelf] = useState<Shelf | null>(null);
  const [filter, setFilter] = useState('');
  const [isMaking, setIsMaking] = useState(false);
  const playlists = useQuery(musicQueries.playlists());
  const followed = useQuery(musicQueries.artists(true));
  const albums = useQuery(musicQueries.albums('recent'));

  const entries = useMemo((): Entry[] => {
    const liked: Entry = {
      key: 'liked',
      shelf: 'liked',
      name: 'Liked Songs',
      detail: 'Playlist',
      artwork: (
        <span className="flex size-12 items-center justify-center rounded-md bg-text text-surface">
          <Icon of={FavouriteIcon} size={20} isActive />
        </span>
      ),
      view: { kind: 'liked' },
    };

    return [
      liked,
      ...(playlists.data ?? []).map((playlist): Entry => ({
        key: `playlist-${playlist.id}`,
        shelf: 'playlists',
        name: playlist.name,
        detail: `Playlist · ${nameOfOwner(playlist.owner)}`,
        artwork: (
          <PlaylistCover
            name={playlist.name}
            albumIds={playlist.artworkAlbumIds}
            className="size-12"
          />
        ),
        view: { kind: 'playlist', id: playlist.id },
      })),
      ...(followed.data ?? []).map((artist): Entry => ({
        key: `artist-${artist.id}`,
        shelf: 'artists',
        name: artist.name,
        detail: 'Artist',
        artwork: (
          <MusicArtwork
            src={pictureOf(artist)}
            label={artist.name}
            shape="round"
            className="size-12"
          />
        ),
        view: { kind: 'artist', id: artist.id },
      })),
      ...(albums.data ?? []).map((album): Entry => ({
        key: `album-${album.id}`,
        shelf: 'albums',
        name: album.title,
        detail: `Album · ${album.artist.name}`,
        artwork: (
          <MusicArtwork
            src={album.hasArtwork ? albumArtworkUrl(album.id) : null}
            label={album.title}
            className="size-12"
          />
        ),
        view: { kind: 'album', id: album.id },
      })),
    ];
  }, [playlists.data, followed.data, albums.data]);

  const typed = filter.trim().toLowerCase();
  const shown = entries.filter(
    (entry) =>
      (shelf === null ||
        entry.shelf === shelf ||
        (shelf === 'playlists' && entry.shelf === 'liked')) &&
      (typed === '' || entry.name.toLowerCase().includes(typed)),
  );

  return (
    <nav aria-label="Your library" className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <h2 className="text-base font-bold text-text">Your Library</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            isActive={view.kind === 'search'}
            label="Search music"
            onClick={() => {
              open({ kind: 'search', query: '' });
            }}
          >
            <Icon of={Search01Icon} size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsMaking(true);
            }}
          >
            <Icon of={Add01Icon} size={16} />
            Create
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-3" role="group" aria-label="Show only">
        {SHELVES.map((chip) => (
          <Button
            key={chip.id}
            variant={shelf === chip.id ? 'glossy' : 'secondary'}
            size="xs"
            isActive={shelf === chip.id}
            aria-pressed={shelf === chip.id}
            onClick={() => {
              setShelf((was) => (was === chip.id ? null : chip.id));
            }}
          >
            {chip.label}
          </Button>
        ))}
      </div>

      <div className="px-3">
        <TextField
          label="Find in your library"
          isLabelHidden
          type="search"
          size="sm"
          icon={<Icon of={Search01Icon} size={14} />}
          placeholder="Find in your library"
          value={filter}
          onValueChange={setFilter}
        />
      </div>

      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-y-auto px-1.5 pb-3"
        onPointerMove={follow}
        onPointerLeave={clear}
      >
        <HoverHighlight rect={rect} radius="md" className="bg-[var(--surface-hover)]" />

        <ul className="relative flex flex-col">
          {shown.map((entry) => {
            const isHere = isSameView(entry.view, view);

            return (
              <li key={entry.key} data-highlight>
                <ContextMenu
                  label={entry.name}
                  groups={musicMenuFor(entry.view, entry.name, player, open)}
                >
                  <Button
                    variant="bare"
                    size="none"
                    hasTooltip={false}
                    aria-current={isHere ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md p-1.5 text-left',
                      isHere ? 'bg-hover' : '',
                    )}
                    onClick={() => {
                      open(entry.view);
                    }}
                  >
                    {entry.artwork}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span
                        className={cn(
                          'truncate text-[0.9375rem] font-medium',
                          isHere ? 'font-semibold text-text' : 'text-text',
                        )}
                      >
                        {entry.name}
                      </span>
                      <span className="truncate text-[0.8125rem] text-text-muted">
                        {entry.detail}
                      </span>
                    </span>
                    {isPlayingFrom(entry.view, state) ? (
                      <Equaliser
                        label="Playing"
                        isMoving={state.isPlaying}
                        className="mr-2 shrink-0 text-text"
                      />
                    ) : null}
                  </Button>
                </ContextMenu>
              </li>
            );
          })}
        </ul>
      </div>

      <PlaylistDialog
        isOpen={isMaking}
        onClose={() => {
          setIsMaking(false);
        }}
        onSaved={(playlistId) => {
          open({ kind: 'playlist', id: playlistId });
        }}
      />
    </nav>
  );
};

MusicLibrary.displayName = 'MusicLibrary';

export { MusicLibrary, isSameView };
