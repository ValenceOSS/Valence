import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Home as HomeIcon,
  ListFilter as ListFilterIcon,
  ListMusic as PlaylistsIcon,
  Plus as PlusIcon,
  Record as AlbumsIcon,
  Search as SearchIcon,
  User as ArtistsIcon,
} from '@keyline-icons/react';
import {
  Heart as HeartFilledIcon,
  Home as HomeFilledIcon,
  ListMusic as PlaylistsFilledIcon,
  Record as AlbumsFilledIcon,
  Search as SearchFilledIcon,
  User as ArtistsFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { ContextMenu } from '@ValenceUI/ContextMenu';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { cn } from '@ValenceUI/cn';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { pictureOf } from '@ValenceScreens/components/ArtistShelf/ArtistShelf';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { PlaylistCover } from '@ValenceScreens/components/PlaylistCover/PlaylistCover';
import { PlaylistDialog } from '@ValenceScreens/components/PlaylistDialog/PlaylistDialog';
import { Equaliser } from '@ValenceScreens/components/Equaliser/Equaliser';
import { isPlayingFrom } from '@ValenceScreens/music/isPlayingFrom';
import { useMyPlaylists } from '@ValenceClient/music/useMyPlaylists';
import { musicMenuFor } from '@ValenceScreens/music/musicMenuFor';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { playlistArtworkUrl } from '@ValenceClient/music/fetchPlaylists';
import type { ReactNode } from 'react';
import type { MusicView } from '@ValenceClient/music/musicView';
import { say } from '@ValenceI18n/say';

type Entry = {
  key: string;
  name: string;
  detail: string;
  artwork: ReactNode;
  view: MusicView;
};

const COVER = 'size-10 rounded-[0.625rem]';

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
 * The sidebar of the music section, standing on the page with nothing round it: the places to go,
 * then what somebody keeps coming back to under a heading each — their playlists, the artists they
 * follow, the albums they played last — narrowed by name from the box above them.
 */
const MusicLibrary = () => {
  const { view, open } = useMusicNavigation();
  const { state, player } = useMusicPlayer();
  const cache = useQueryClient();
  const addingTo = useMyPlaylists();
  const { containerRef, rect, follow, clear } = useSlidingHighlight();
  const [filter, setFilter] = useState('');
  const [making, setMaking] = useState<'byHand' | 'smart' | null>(null);
  const canMakeSmart = useServerHas('library.smartLists') === true;
  const playlists = useQuery(musicQueries.playlists());
  const followed = useQuery(musicQueries.artists(true));
  const albums = useQuery(musicQueries.albums('played'));
  const playingId = state.current?.id ?? null;

  useEffect(() => {
    if (playingId !== null) {
      void cache.invalidateQueries({ queryKey: musicQueries.albums('played').queryKey });
    }
  }, [cache, playingId]);

  const places = [
    { label: say('common.home'), to: { kind: 'home' }, of: HomeIcon, lit: HomeFilledIcon },
    {
      label: say('common.search'),
      to: { kind: 'search', query: '' },
      of: SearchIcon,
      lit: SearchFilledIcon,
    },
    {
      label: say('common.likedSongs2'),
      to: { kind: 'liked' },
      of: HeartFilledIcon,
      lit: HeartFilledIcon,
    },
    { label: say('common.albums'), to: { kind: 'albums' }, of: AlbumsIcon, lit: AlbumsFilledIcon },
    {
      label: say('common.artists'),
      to: { kind: 'artists' },
      of: ArtistsIcon,
      lit: ArtistsFilledIcon,
    },
    {
      label: say('common.playlists'),
      to: { kind: 'playlists' },
      of: PlaylistsIcon,
      lit: PlaylistsFilledIcon,
    },
  ] satisfies { label: string; to: MusicView; of: typeof HomeIcon; lit: typeof HomeIcon }[];

  const typed = filter.trim().toLowerCase();
  const matching = (entries: Entry[]) =>
    entries.filter((entry) => typed === '' || entry.name.toLowerCase().includes(typed));

  const sections: { heading: string; action?: ReactNode; entries: Entry[] }[] = [
    {
      heading: say('common.playlists'),
      action: canMakeSmart ? (
        <ActionMenu
          label={say('common.create')}
          trigger={<Icon of={PlusIcon} size={16} />}
          align="end"
          groups={[
            {
              items: [
                {
                  id: 'byHand',
                  label: say('common.newPlaylist'),
                  icon: <Icon of={PlusIcon} size={16} />,
                  onChoose: () => {
                    setMaking('byHand');
                  },
                },
                {
                  id: 'smart',
                  label: say('common.newSmartPlaylist'),
                  icon: <Icon of={ListFilterIcon} size={16} />,
                  onChoose: () => {
                    setMaking('smart');
                  },
                },
              ],
            },
          ]}
        />
      ) : (
        <Button
          variant="ghost"
          size="xs"
          isIconOnly
          label={say('common.create')}
          onClick={() => {
            setMaking('byHand');
          }}
        >
          <Icon of={PlusIcon} size={16} />
        </Button>
      ),
      entries: matching(
        (playlists.data ?? []).map((playlist) => ({
          key: `playlist-${playlist.id}`,
          name: playlist.name,
          detail:
            playlist.owner === null
              ? say('screens.musicPage.musicLibrary.playlistOfARemovedProfile')
              : say('screens.musicPage.musicLibrary.playlistOwner', {
                  owner: playlist.owner.name,
                }),
          artwork: (
            <PlaylistCover
              name={playlist.name}
              albumIds={playlist.artworkAlbumIds}
              artwork={playlistArtworkUrl(playlist)}
              className={COVER}
            />
          ),
          view: { kind: 'playlist', id: playlist.id },
        })),
      ),
    },
    {
      heading: say('common.following'),
      entries: matching(
        (followed.data ?? []).map((artist) => ({
          key: `artist-${artist.id}`,
          name: artist.name,
          detail: say('common.artist'),
          artwork: (
            <MusicArtwork
              src={pictureOf(artist)}
              label={artist.name}
              shape="round"
              className="size-10"
            />
          ),
          view: { kind: 'artist', id: artist.id },
        })),
      ),
    },
    {
      heading: say('screens.musicPage.musicHome.recentlyPlayed'),
      entries: matching(
        (albums.data ?? []).map((album) => ({
          key: `album-${album.id}`,
          name: album.title,
          detail: album.artist.name,
          artwork: (
            <MusicArtwork
              src={album.hasArtwork ? albumArtworkUrl(album.id) : null}
              label={album.title}
              className={COVER}
            />
          ),
          view: { kind: 'album', id: album.id },
        })),
      ),
    },
  ];

  return (
    <nav aria-label={say('common.yourLibrary')} className="flex h-full min-h-0 flex-col">
      <div
        ref={containerRef}
        className="valence-rail relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-6"
        onPointerMove={follow}
        onPointerLeave={clear}
      >
        <HoverHighlight rect={rect} radius="md" />

        <ul className="relative flex flex-col">
          {places.map(({ label, to, of, lit }) => {
            const isHere = to.kind === 'search' ? view.kind === 'search' : isSameView(to, view);

            return (
              <li key={to.kind} data-highlight>
                <Button
                  variant="bare"
                  size="none"
                  hasTooltip={false}
                  aria-current={isHere ? 'page' : undefined}
                  className={cn(
                    'flex h-10 w-full items-center gap-3 rounded-md px-2.5 text-left text-[0.9375rem] font-medium',
                    isHere ? 'bg-hover font-semibold text-text' : 'text-text-muted hover:text-text',
                  )}
                  onClick={() => {
                    open(to);
                  }}
                >
                  <Icon of={of} whenActive={lit} isActive={isHere} size={18} />
                  {label}
                </Button>
              </li>
            );
          })}
        </ul>

        <div className="relative px-1 pt-4 pb-1">
          <TextField
            label={say('screens.searchArea.everythingYouOwn')}
            isLabelHidden
            type="search"
            size="sm"
            placeholder={say('screens.searchArea.everythingYouOwn')}
            value={filter}
            onValueChange={setFilter}
          />
        </div>

        {sections.map(({ heading, action, entries }) =>
          entries.length === 0 && action === undefined ? null : (
            <section key={heading} aria-label={heading} className="relative pt-4">
              <div className="flex h-7 items-center justify-between px-2.5">
                <h2 className="text-xs font-semibold text-text-muted">{heading}</h2>
                {action}
              </div>

              <ul className="flex flex-col">
                {entries.map((entry) => {
                  const isHere = isSameView(entry.view, view);

                  return (
                    <li
                      key={entry.key}
                      data-highlight
                      onPointerEnter={() => {
                        if (entry.view.kind === 'artist') {
                          void cache.prefetchQuery(musicQueries.artist(entry.view.id));
                        }
                      }}
                    >
                      <ContextMenu
                        label={entry.name}
                        groups={musicMenuFor(entry.view, entry.name, player, open, addingTo)}
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
                                'truncate text-sm text-text',
                                isHere ? 'font-semibold' : 'font-medium',
                              )}
                            >
                              {entry.name}
                            </span>
                            <span className="truncate text-xs text-text-muted">{entry.detail}</span>
                          </span>
                          {isPlayingFrom(entry.view, state) ? (
                            <Equaliser
                              label={say('common.playing')}
                              isMoving={state.isPlaying}
                              className="mr-1.5 shrink-0 text-text"
                            />
                          ) : null}
                        </Button>
                      </ContextMenu>
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
        )}
      </div>

      <PlaylistDialog
        isOpen={making !== null}
        isSmart={making === 'smart'}
        onClose={() => {
          setMaking(null);
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
