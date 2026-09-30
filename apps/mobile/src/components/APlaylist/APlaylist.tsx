import { ListMusic, MoreHorizontal } from '@keyline-icons/react-native';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActionSheetIOS, ActivityIndicator, Alert } from 'react-native';
import {
  UIImagePickerPreferredAssetRepresentationMode,
  launchImageLibraryAsync,
} from 'expo-image-picker';
import {
  dropFromPlaylist,
  dropPlaylistArtwork,
  playlistArtworkUrl,
  moveInPlaylist,
  removePlaylist,
  updatePlaylist,
} from '@ValenceClient/music/fetchPlaylists';
import { whereAnEntryLands } from '@ValenceClient/music/whereAnEntryLands';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMoodBackground } from '@ValenceMobile/components/AMoodBackground/AMoodBackground';
import { AMusicHead } from '@ValenceMobile/components/AMusicHead/AMusicHead';
import { ATrackList } from '@ValenceMobile/components/ATrackList/ATrackList';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { APluginPanels } from '@ValenceMobile/components/APluginPanels/APluginPanels';
import { Words } from '@ValenceMobile/components/Words/Words';
import { howLongItRuns } from '@ValenceMobile/components/ATitle/howLongItRuns';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { APlaylistDetails } from '@ValenceMobile/components/APlaylistDetails/APlaylistDetails';
import { Button } from '@ValenceMobile/components/Button/Button';
import { coverAlbumsOf } from '@ValenceClient/music/coverAlbumsOf';
import { sendAPhoto } from '@ValenceMobile/platform/sendAPhoto';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import type { APlaylistProps } from './APlaylist.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * One playlist, as the web's playlist page draws it: the cover of its first album, whose it is and
 * how long it runs, a way to play it, and its tracks in its order, lit from behind in the colours
 * of that cover. A track whose file has gone
 * from the library is left out, as the web leaves it out, rather than listed and refusing to play.
 *
 * One of somebody's own can be changed from here as on the web: shared with the household or kept
 * to themselves, renamed or re-described, deleted after asking, and each track moved up or down or
 * taken out from its menu.
 *
 * @param playlistId - Which playlist.
 * @param onAlbum - Told to open an album.
 * @param onArtist - Told to open an artist.
 * @param onBack - Told somebody is done with it.
 */
const APlaylist = ({ playlistId, onAlbum, onArtist, onBack }: APlaylistProps) => {
  const colours = useTheColours();
  const cache = useQueryClient();
  const read = useQuery(musicQueries.playlist(playlistId));
  const player = thePhonesMusicPlayer();
  const coverAlbumId = read.data?.playlist.artworkAlbumIds[0] ?? null;
  const ownCover = read.data === undefined ? null : playlistArtworkUrl(read.data.playlist);
  const lights = usePictureLights(
    ownCover !== null
      ? onThisServer(ownCover)
      : coverAlbumId === null
        ? null
        : onThisServer(albumArtworkUrl(coverAlbumId)),
  );
  const [isEditing, setIsEditing] = useState(false);

  const refresh = () => cache.invalidateQueries({ queryKey: musicQueries.key });

  if (read.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  if (read.data === undefined) {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="danger">{say('phone.aPlaylist.thatPlaylistCouldNotBeRead')}</Words>
      </Screen>
    );
  }

  const { playlist, entries } = read.data;
  const songs = entries.flatMap((entry) =>
    entry.item === null || entry.item.track === null
      ? []
      : [{ entryId: entry.id, track: entry.item.track }],
  );
  const tracks = songs.map((song) => song.track);
  const entryIds = songs.map((song) => song.entryId);

  const chooseACover = async () => {
    const chosen = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      preferredAssetRepresentationMode: UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    const asset = chosen.assets?.[0];

    if (chosen.canceled || asset === undefined) {
      return;
    }

    const wrong = await sendAPhoto(
      `/api/playlists/${playlist.id}/artwork`,
      asset.uri,
      profileHeaders(),
    );

    if (wrong !== null) {
      Alert.alert(wrong);

      return;
    }

    await refresh();
  };

  const askWhatToDo = () => {
    const choices = [
      {
        label: playlist.isShared ? say('common.stopSharing') : say('common.shareWithTheHousehold'),
        run: () => {
          void updatePlaylist(playlist.id, { isShared: !playlist.isShared }).then(refresh);
        },
      },
      {
        label: say('common.editDetails'),
        run: () => {
          setIsEditing(true);
        },
      },
      {
        label: say('common.chooseACover'),
        run: () => {
          void chooseACover();
        },
      },
      ...(playlist.hasOwnArtwork
        ? [
            {
              label: say('common.useTheSongsCovers'),
              run: () => {
                void dropPlaylistArtwork(playlist.id).then(refresh);
              },
            },
          ]
        : []),
      {
        label: say('common.deletePlaylist'),
        run: () => {
          Alert.alert(
            say('common.deleteName', { name: playlist.name }),
            say('common.theSongsStayInTheLibrary'),
            [
              { text: say('common.cancel'), style: 'cancel' },
              {
                text: say('common.delete'),
                style: 'destructive',
                onPress: () => {
                  void removePlaylist(playlist.id).then(async (isGone) => {
                    if (isGone) {
                      await refresh();
                      onBack();
                    }
                  });
                },
              },
            ],
          );
        },
      },
    ];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: playlist.name,
        options: [...choices.map((choice) => choice.label), say('common.cancel')],
        cancelButtonIndex: choices.length,
        destructiveButtonIndex: choices.length - 1,
      },
      (picked) => {
        choices[picked]?.run();
      },
    );
  };
  const source = { kind: 'playlist' as const, id: playlist.id, name: playlist.name };
  const detail = [
    playlist.isMine || playlist.owner === null ? null : playlist.owner.name,
    sayCount('common.count.songs', tracks.length),
    howLongItRuns(playlist.durationSeconds),
  ].filter((part) => part !== null);

  return (
    <Screen scrolls onBack={onBack} behind={<AMoodBackground palette={lights} />}>
      <AMusicHead
        kind={say('common.playlist')}
        title={playlist.name}
        detail={detail.join(' · ')}
        artwork={ownCover === null ? null : onThisServer(ownCover)}
        {...(ownCover === null ? { albumIds: coverAlbumsOf(tracks) } : {})}
        standIn={ListMusic}
        canPlay={tracks.length > 0}
        onPlay={() => {
          player.play(tracks, 0, { source, isOrdered: playlist.isOrdered });
        }}
        onShuffle={() => {
          player.play(tracks, Math.floor(Math.random() * tracks.length), {
            source,
            isShuffled: true,
          });
        }}
      >
        {playlist.description === null ? null : (
          <Words tone="muted" isCentred>
            {playlist.description}
          </Words>
        )}

        {playlist.isMine ? (
          <Button
            tone="ghost"
            icon={MoreHorizontal}
            label={say('common.moreForName', { name: playlist.name })}
            onPress={askWhatToDo}
          >
            {say('common.more')}
          </Button>
        ) : null}
      </AMusicHead>

      {tracks.length === 0 ? (
        <ANothingHere
          of={ListMusic}
          title={say('common.nothingInThisPlaylistYet')}
          detail={say('common.addSongsToItFromThe')}
        />
      ) : (
        <ATrackList
          tracks={tracks}
          source={source}
          isOrdered={playlist.isOrdered}
          onAlbum={onAlbum}
          onArtist={onArtist}
          {...(playlist.isMine
            ? {
                editing: {
                  onRemove: (at: number) => {
                    const entryId = entryIds[at];

                    if (entryId !== undefined) {
                      void dropFromPlaylist(playlist.id, entryId).then(refresh);
                    }
                  },
                  onMove: (from: number, to: number) => {
                    const entryId = entryIds[from];

                    if (entryId !== undefined) {
                      void moveInPlaylist(
                        playlist.id,
                        entryId,
                        whereAnEntryLands(entryIds, from, to),
                      ).then(refresh);
                    }
                  },
                },
              }
            : {})}
        />
      )}

      <APlaylistDetails
        isOpen={isEditing}
        editing={playlist}
        onClose={() => {
          setIsEditing(false);
        }}
        onDone={() => {
          setIsEditing(false);
          void refresh();
        }}
      />
      <APluginPanels on="playlist" subjectId={playlistId} />
    </Screen>
  );
};

APlaylist.displayName = 'APlaylist';

export { APlaylist };
