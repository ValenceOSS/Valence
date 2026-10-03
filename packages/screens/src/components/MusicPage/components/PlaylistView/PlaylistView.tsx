import { useState } from 'react';
import { PluginPanels } from '@ValenceScreens/components/PluginPanels/PluginPanels';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ImagePlus as ImagePlusIcon,
  ListMusic as ListMusicIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Shuffle as ShuffleIcon,
} from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  Image as ImageFilledIcon,
  Play as PlayFilledIcon,
  Share as ShareFilledIcon,
  SquarePen as SquarePenFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
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
  dropPlaylistArtwork,
  moveInPlaylist,
  playlistArtworkUrl,
  removePlaylist,
  savePlaylistArtwork,
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
 * renamed, given a cover of its own or its songs' covers back, shared with the household or made
 * private again, told its order matters, reordered a
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
  const [isSendingCover, setIsSendingCover] = useState(false);
  const firstCover = detail?.playlist.artworkAlbumIds[0];
  const ownCover = detail === undefined ? null : playlistArtworkUrl(detail.playlist);
  useLightTheMusic(ownCover ?? (firstCover === undefined ? null : albumArtworkUrl(firstCover)));

  const refresh = () => {
    void cache.invalidateQueries({ queryKey: musicQueries.playlistsKey });
  };

  if (asked.isError) {
    return (
      <CouldNotRead
        said={say('screens.musicPage.playlistView.thisPlaylistCouldNotBeRead')}
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
        <Skeleton
          label={say('screens.musicPage.playlistView.readingThePlaylist')}
          shape="soft"
          className="size-48"
        />
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
            ? say('screens.musicPage.playlistView.sharedPlaylist')
            : say('common.playlist')
        }
        title={playlist.name}
        artwork={
          <PlaylistCover
            name={playlist.name}
            albumIds={playlist.artworkAlbumIds}
            artwork={ownCover}
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
                others.length === 0 ? 'common.count.songs' : 'common.count.items',
                entries.length - lost.length,
              )}
            </span>
            <span>· {formatDuration(playlist.durationSeconds)}</span>
            {playlist.isOrdered ? (
              <span>{say('screens.musicPage.playlistView.inOrder')}</span>
            ) : null}
            {lost.length === 0 ? null : (
              <span>
                ·{' '}
                {sayCount('screens.musicPage.playlistView.countNoLongerInTheLibrary', lost.length)}
              </span>
            )}
          </>
        }
        actions={
          <>
            <Button
              variant="confirm"
              size="lg"
              isIconOnly
              label={say('common.playName', { name: playlist.name })}
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
              label={say('screens.musicPage.playlistView.shuffleName', { name: playlist.name })}
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

            {playlist.isMine ? (
              <FilePicker
                label={say('common.chooseACover')}
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                variant="ghost"
                size="md"
                isLoading={isSendingCover}
                onPick={(file) => {
                  setIsSendingCover(true);
                  void savePlaylistArtwork(playlist.id, file).then((wrong) => {
                    setIsSendingCover(false);
                    refresh();

                    if (wrong === null) {
                      notify.worked(
                        say('screens.musicPage.playlistView.nameHasANewCover', {
                          name: playlist.name,
                        }),
                      );
                    } else {
                      notify.failed(wrong);
                    }
                  });
                }}
              >
                <Icon of={ImagePlusIcon} size={22} />
              </FilePicker>
            ) : null}

            {playlist.isMine || mayClearAbandoned ? (
              <ActionMenu
                label={say('common.moreForName', { name: playlist.name })}
                trigger={<Icon of={MoreHorizontalIcon} size={22} />}
                groups={[
                  {
                    items: [
                      ...(playlist.isMine
                        ? [
                            {
                              id: 'share',
                              label: playlist.isShared
                                ? say('common.stopSharing')
                                : say('common.shareWithTheHousehold'),
                              icon: <Icon of={ShareFilledIcon} size={16} />,
                              onChoose: () => {
                                void updatePlaylist(playlist.id, {
                                  isShared: !playlist.isShared,
                                }).then((agreed) => {
                                  refresh();

                                  if (agreed) {
                                    notify.worked(
                                      playlist.isShared
                                        ? say(
                                            'screens.musicPage.playlistView.nameIsYoursAloneAgain',
                                            { name: playlist.name },
                                          )
                                        : say(
                                            'screens.musicPage.playlistView.nameIsSharedWithTheHousehold',
                                            { name: playlist.name },
                                          ),
                                    );
                                  }
                                });
                              },
                            },
                            {
                              id: 'edit',
                              label: say('common.editDetails'),
                              icon: <Icon of={SquarePenFilledIcon} size={16} />,
                              onChoose: () => {
                                setIsEditing(true);
                              },
                            },
                            ...(playlist.hasOwnArtwork
                              ? [
                                  {
                                    id: 'cover',
                                    label: say('common.useTheSongsCovers'),
                                    icon: <Icon of={ImageFilledIcon} size={16} />,
                                    onChoose: () => {
                                      void dropPlaylistArtwork(playlist.id).then(refresh);
                                    },
                                  },
                                ]
                              : []),
                          ]
                        : []),
                      {
                        id: 'delete',
                        label: say('common.deletePlaylist'),
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
            title={say('common.nothingInThisPlaylistYet')}
            detail={say('common.addSongsToItFromThe')}
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
          <section
            aria-label={say('screens.musicPage.playlistView.alsoInThisPlaylist')}
            className="flex flex-col gap-2"
          >
            <h2 className="px-2 text-sm font-semibold text-text-muted">
              {say('screens.musicPage.playlistView.alsoInThisPlaylist')}
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
            aria-label={say('common.noLongerInTheLibrary')}
            className="flex flex-col gap-2 px-2"
          >
            <h2 className="text-sm font-semibold text-text-muted">
              {say('common.noLongerInTheLibrary')}
            </h2>
            <p className="text-sm text-text-muted">
              {sayCount('screens.musicPage.playlistView.countWentWithTheLibrary', lost.length)}
            </p>
            {playlist.isMine ? (
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                label={say('screens.musicPage.playlistView.removeWhatIsGoneFromName', {
                  name: playlist.name,
                })}
                onClick={() => {
                  void Promise.all(
                    lost.map((entry) => dropFromPlaylist(playlist.id, entry.id)),
                  ).then(refresh);
                }}
              >
                {lost.length === 1
                  ? say('common.removeIt')
                  : say('screens.musicPage.playlistView.removeThem')}
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
          title={say('common.deleteName', { name: playlist.name })}
          detail={
            playlist.owner === null
              ? say('screens.musicPage.playlistView.thisBelongedToAProfileThat')
              : say('common.theSongsStayInTheLibrary')
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

      <PluginPanels on="playlist" subjectId={playlistId} className="px-3 pb-8 pt-6" />
    </article>
  );
};

PlaylistView.displayName = 'PlaylistView';

export { PlaylistView };
