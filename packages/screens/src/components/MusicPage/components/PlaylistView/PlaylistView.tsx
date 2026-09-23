import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bin as BinIcon,
  ListMusic as ListMusicIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Share as ShareIcon,
  Shuffle as ShuffleIcon,
  SquarePen as SquarePenIcon,
} from '@keyline-icons/react';
import { Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Skeleton } from '@ValenceUI/Skeleton';
import { notify } from '@ValenceUI/notify';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { MEDIA_KIND_LABELS } from '@ValenceContracts/schemas/MediaKind';
import {
  dropFromPlaylist,
  moveInPlaylist,
  removePlaylist,
  updatePlaylist,
} from '@ValenceClient/music/fetchPlaylists';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { MusicHeader } from '@ValenceScreens/components/MusicHeader/MusicHeader';
import { PlaylistCover } from '@ValenceScreens/components/PlaylistCover/PlaylistCover';
import { PlaylistDialog } from '@ValenceScreens/components/PlaylistDialog/PlaylistDialog';
import { TrackList } from '@ValenceScreens/components/TrackList/TrackList';
import { useLightTheMusic } from '@ValenceScreens/music/useLightTheMusic';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { nameOfOwner } from '@ValenceScreens/music/nameOfOwner';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';
import type { PlaylistViewProps } from './PlaylistView.types';

/**
 * Counts what is in a playlist in words that read properly at one as well as at many.
 *
 * @param count - How many.
 * @param noun - What one is called.
 * @returns The count and its noun.
 */
const countOf = (count: number, noun: string): string =>
  count === 1 ? `1 ${noun}` : `${count.toString()} ${noun}s`;

/**
 * A playlist's page: its cover made of what is in it, whose it is, and everything in it in order.
 *
 * Somebody else's shared playlist can be played and shuffled but not changed. One's own can be
 * renamed, shared with the household or made private again, told its order matters, reordered a
 * song at a time and emptied a song at a time. Anything in it that is not music — a film for a film
 * night — is listed below the songs, since this player only plays songs.
 *
 * @param playlistId - The playlist.
 */
const PlaylistView = ({ playlistId }: PlaylistViewProps) => {
  const cache = useQueryClient();
  const asked = useQuery(musicQueries.playlist(playlistId));
  const { open } = useMusicNavigation();
  const { player } = useMusicPlayer();
  const [isEditing, setIsEditing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { may } = useWhatIMayDo();
  const detail = asked.data;
  const firstCover = detail?.playlist.artworkAlbumIds[0];
  useLightTheMusic(firstCover === undefined ? null : albumArtworkUrl(firstCover));

  const refresh = () => {
    void cache.invalidateQueries({ queryKey: musicQueries.playlistsKey });
  };

  if (asked.isError) {
    return (
      <CouldNotRead
        what="this playlist"
        isTryingAgain={asked.isFetching}
        onTryAgain={() => {
          void asked.refetch();
        }}
      />
    );
  }

  if (detail === undefined) {
    return (
      <div className={`flex flex-col gap-4 py-8 ${MUSIC_LANES.page}`}>
        <Skeleton label="Reading the playlist" shape="soft" className="size-48" />
        <Skeleton className="h-12 w-2/3" />
      </div>
    );
  }

  const { playlist, entries } = detail;
  const songs = entries.flatMap((entry) =>
    entry.item === null || entry.item.track === null ? [] : [{ entry, track: entry.item.track }],
  );
  const tracks: MusicTrack[] = songs.map((song) => song.track);
  const others = entries.flatMap((entry) =>
    entry.item === null || entry.item.track !== null ? [] : [{ id: entry.id, item: entry.item }],
  );
  const lost = entries.filter((entry) => entry.item === null);
  const mayClearAbandoned = playlist.owner === null && may('account.profiles');
  const source = { kind: 'playlist' as const, id: playlist.id, name: playlist.name };
  const options = { source, isOrdered: playlist.isOrdered };

  return (
    <article className="flex flex-col">
      <MusicHeader
        eyebrow={playlist.isShared ? 'Shared playlist' : 'Playlist'}
        title={playlist.name}
        artwork={
          <PlaylistCover
            name={playlist.name}
            albumIds={playlist.artworkAlbumIds}
            className="w-full"
          />
        }
        details={
          <>
            {playlist.description === null ? null : (
              <span className="w-full pb-1 text-text">{playlist.description}</span>
            )}
            <span className="font-semibold text-text">{nameOfOwner(playlist.owner)}</span>
            <span>
              · {countOf(entries.length - lost.length, others.length === 0 ? 'song' : 'item')}
            </span>
            <span>· {formatDuration(playlist.durationSeconds)}</span>
            {playlist.isOrdered ? <span>· In order</span> : null}
            {lost.length === 0 ? null : (
              <span>· {countOf(lost.length, 'thing')} no longer in the library</span>
            )}
          </>
        }
        actions={
          <>
            <Button
              variant="confirm"
              size="lg"
              isIconOnly
              label={`Play ${playlist.name}`}
              className="size-14"
              disabled={tracks.length === 0}
              onClick={() => {
                player.play(tracks, 0, options);
              }}
            >
              <Icon of={PlayFilledIcon} size={24} />
            </Button>

            <Button
              variant="ghost"
              size="md"
              isIconOnly
              label={`Shuffle ${playlist.name}`}
              disabled={tracks.length === 0 || playlist.isOrdered}
              onClick={() => {
                player.play(tracks, Math.floor(Math.random() * tracks.length), {
                  ...options,
                  isShuffled: true,
                });
              }}
            >
              <Icon of={ShuffleIcon} size={22} />
            </Button>

            {playlist.isMine || mayClearAbandoned ? (
              <ActionMenu
                label={`More for ${playlist.name}`}
                trigger={<Icon of={MoreHorizontalIcon} size={22} />}
                groups={[
                  {
                    items: [
                      ...(playlist.isMine
                        ? [
                            {
                              id: 'share',
                              label: playlist.isShared
                                ? 'Stop sharing'
                                : 'Share with the household',
                              icon: <Icon of={ShareIcon} size={16} />,
                              onChoose: () => {
                                void updatePlaylist(playlist.id, {
                                  isShared: !playlist.isShared,
                                }).then((agreed) => {
                                  refresh();

                                  if (agreed) {
                                    notify.worked(
                                      playlist.isShared
                                        ? `${playlist.name} is yours alone again`
                                        : `${playlist.name} is shared with the household`,
                                    );
                                  }
                                });
                              },
                            },
                            {
                              id: 'edit',
                              label: 'Edit details',
                              icon: <Icon of={SquarePenIcon} size={16} />,
                              onChoose: () => {
                                setIsEditing(true);
                              },
                            },
                          ]
                        : []),
                      {
                        id: 'delete',
                        label: 'Delete playlist',
                        icon: <Icon of={BinIcon} size={16} />,
                        isDestructive: true,
                        onChoose: () => {
                          setIsRemoving(true);
                        },
                      },
                    ],
                  },
                ]}
              />
            ) : null}
          </>
        }
      />

      <div className={`flex flex-col gap-8 pb-10 ${MUSIC_LANES.tracks}`}>
        {entries.length === 0 ? (
          <NothingHere
            of={ListMusicIcon}
            title="Nothing in this playlist yet"
            detail="Add songs to it from the menu beside any song."
          />
        ) : (
          <TrackList
            label={playlist.name}
            tracks={tracks}
            showsArtwork
            onPlay={(index) => {
              player.play(tracks, index, options);
            }}
            {...(playlist.isMine
              ? {
                  onRemove: (index: number) => {
                    const entry = songs[index]?.entry;

                    if (entry !== undefined) {
                      void dropFromPlaylist(playlist.id, entry.id).then(refresh);
                    }
                  },
                  onReorder: (from: number, to: number) => {
                    const entry = songs[from]?.entry;
                    const after =
                      to > from ? (songs[to]?.entry.id ?? null) : (songs[to - 1]?.entry.id ?? null);

                    if (entry !== undefined && from !== to) {
                      void moveInPlaylist(playlist.id, entry.id, after).then(refresh);
                    }
                  },
                  onMove: (index: number, direction: 'up' | 'down') => {
                    const entry = songs[index]?.entry;
                    const after =
                      direction === 'up'
                        ? (songs[index - 2]?.entry.id ?? null)
                        : (songs[index + 1]?.entry.id ?? null);

                    if (entry !== undefined) {
                      void moveInPlaylist(playlist.id, entry.id, after).then(refresh);
                    }
                  },
                }
              : {})}
          />
        )}

        {others.length === 0 ? null : (
          <section aria-label="Also in this playlist" className="flex flex-col gap-2">
            <h2 className="px-2 text-sm font-semibold uppercase tracking-[0.12em] text-text-muted">
              Also in this playlist
            </h2>
            <ul className="flex flex-col">
              {others.map((other) => (
                <li
                  key={other.id}
                  className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm"
                >
                  <span className="truncate text-text">{other.item.title}</span>
                  <span className="shrink-0 text-text-muted">
                    {MEDIA_KIND_LABELS[other.item.kind]}
                    {other.item.subtitle === null ? '' : ` · ${other.item.subtitle}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {lost.length === 0 ? null : (
          <section aria-label="No longer in the library" className="flex flex-col gap-2 px-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-muted">
              No longer in the library
            </h2>
            <p className="text-sm text-text-muted">
              {countOf(lost.length, 'thing')} that {lost.length === 1 ? 'was' : 'were'} in this
              playlist went with the library {lost.length === 1 ? 'it' : 'they'} came from.
            </p>
            {playlist.isMine ? (
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                label={`Remove what is gone from ${playlist.name}`}
                onClick={() => {
                  void Promise.all(
                    lost.map((entry) => dropFromPlaylist(playlist.id, entry.id)),
                  ).then(refresh);
                }}
              >
                Remove {lost.length === 1 ? 'it' : 'them'}
              </Button>
            ) : null}
          </section>
        )}
      </div>

      {playlist.isMine ? (
        <PlaylistDialog
          isOpen={isEditing}
          playlist={playlist}
          onClose={() => {
            setIsEditing(false);
          }}
        />
      ) : null}

      {playlist.isMine || mayClearAbandoned ? (
        <ConfirmDialog
          isOpen={isRemoving}
          title={`Delete ${playlist.name}?`}
          detail={
            playlist.owner === null
              ? 'This belonged to a profile that has been removed. The songs stay in the library. Only the playlist goes, for everybody it was shared with.'
              : 'The songs stay in the library. Only the playlist goes, for everybody it was shared with.'
          }
          confirmLabel="Delete"
          isDestructive
          onClose={() => {
            setIsRemoving(false);
          }}
          onConfirm={() => {
            void removePlaylist(playlist.id).then((removed) => {
              setIsRemoving(false);
              refresh();

              if (removed) {
                open({ kind: 'home' });
              }
            });
          }}
        />
      ) : null}
    </article>
  );
};

PlaylistView.displayName = 'PlaylistView';

export { PlaylistView };
