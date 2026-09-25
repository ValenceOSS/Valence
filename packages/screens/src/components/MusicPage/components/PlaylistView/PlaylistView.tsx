import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ListMusic as ListMusicIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Shuffle as ShuffleIcon,
} from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  Play as PlayFilledIcon,
  Share as ShareFilledIcon,
  SquarePen as SquarePenFilledIcon,
} from '@keyline-icons/react/fill';
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
import { whereAnEntryLands } from '@ValenceClient/music/whereAnEntryLands';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';
import type { PlaylistViewProps } from './PlaylistView.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

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
        what={say('screens.playlistView.couldNotReadWhat')}
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
        <Skeleton label={say('screens.playlistView.reading')} shape="soft" className="size-48" />
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
        eyebrow={
          playlist.isShared
            ? say('screens.playlistView.sharedPlaylist')
            : say('screens.playlistView.playlist')
        }
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
              ·{' '}
              {sayCount(
                others.length === 0
                  ? 'screens.playlistView.songCount'
                  : 'screens.playlistView.itemCount',
                entries.length - lost.length,
              )}
            </span>
            <span>· {formatDuration(playlist.durationSeconds)}</span>
            {playlist.isOrdered ? <span>· {say('screens.playlistView.inOrder')}</span> : null}
            {lost.length === 0 ? null : (
              <span>· {sayCount('screens.playlistView.lostCount', lost.length)}</span>
            )}
          </>
        }
        actions={
          <>
            <Button
              variant="confirm"
              size="lg"
              isIconOnly
              label={say('screens.playlistView.play', { name: playlist.name })}
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
              label={say('screens.playlistView.shuffle', { name: playlist.name })}
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
                label={say('screens.playlistView.more', { name: playlist.name })}
                trigger={<Icon of={MoreHorizontalIcon} size={22} />}
                groups={[
                  {
                    items: [
                      ...(playlist.isMine
                        ? [
                            {
                              id: 'share',
                              label: playlist.isShared
                                ? say('screens.playlistView.stopSharing')
                                : say('screens.playlistView.share'),
                              icon: <Icon of={ShareFilledIcon} size={16} />,
                              onChoose: () => {
                                void updatePlaylist(playlist.id, {
                                  isShared: !playlist.isShared,
                                }).then((agreed) => {
                                  refresh();

                                  if (agreed) {
                                    notify.worked(
                                      playlist.isShared
                                        ? say('screens.playlistView.nowPrivate', {
                                            name: playlist.name,
                                          })
                                        : say('screens.playlistView.nowShared', {
                                            name: playlist.name,
                                          }),
                                    );
                                  }
                                });
                              },
                            },
                            {
                              id: 'edit',
                              label: say('screens.playlistView.editDetails'),
                              icon: <Icon of={SquarePenFilledIcon} size={16} />,
                              onChoose: () => {
                                setIsEditing(true);
                              },
                            },
                          ]
                        : []),
                      {
                        id: 'delete',
                        label: say('screens.playlistView.deletePlaylist'),
                        icon: <Icon of={BinFilledIcon} size={16} />,
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
            title={say('screens.playlistView.emptyTitle')}
            detail={say('screens.playlistView.emptyDetail')}
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
                    const after = whereAnEntryLands(
                      songs.map((song) => song.entry.id),
                      from,
                      to,
                    );

                    if (entry !== undefined && from !== to) {
                      void moveInPlaylist(playlist.id, entry.id, after).then(refresh);
                    }
                  },
                  onMove: (index: number, direction: 'up' | 'down') => {
                    const entry = songs[index]?.entry;
                    const after = whereAnEntryLands(
                      songs.map((song) => song.entry.id),
                      index,
                      direction === 'up' ? index - 1 : index + 1,
                    );

                    if (entry !== undefined) {
                      void moveInPlaylist(playlist.id, entry.id, after).then(refresh);
                    }
                  },
                }
              : {})}
          />
        )}

        {others.length === 0 ? null : (
          <section aria-label={say('screens.playlistView.alsoIn')} className="flex flex-col gap-2">
            <h2 className="px-2 text-sm font-semibold uppercase tracking-[0.12em] text-text-muted">
              {say('screens.playlistView.alsoIn')}
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
          <section
            aria-label={say('screens.playlistView.lostHeading')}
            className="flex flex-col gap-2 px-2"
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-muted">
              {say('screens.playlistView.lostHeading')}
            </h2>
            <p className="text-sm text-text-muted">
              {sayCount('screens.playlistView.lostDetail', lost.length)}
            </p>
            {playlist.isMine ? (
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                label={say('screens.playlistView.removeLostLabel', { name: playlist.name })}
                onClick={() => {
                  void Promise.all(
                    lost.map((entry) => dropFromPlaylist(playlist.id, entry.id)),
                  ).then(refresh);
                }}
              >
                {sayCount('screens.playlistView.removeLost', lost.length)}
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
          title={say('screens.playlistView.deleteTitle', { name: playlist.name })}
          detail={
            playlist.owner === null
              ? say('screens.playlistView.deleteOrphanDetail')
              : say('screens.playlistView.deleteDetail')
          }
          confirmLabel={say('common.delete')}
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
