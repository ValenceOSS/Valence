import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { ATrackRow } from '@ValenceMobile/components/ATrackRow/ATrackRow';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import { askAboutATrack } from '@ValenceMobile/music/askAboutATrack';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import type { ATrackListProps } from './ATrackList.types';

/**
 * A list of tracks, any of which plays the list from there, as the web's track lists do: an
 * album's by their numbers, anything else by their covers.
 *
 * Playing from a track hands the whole list to the player, so the rest of it follows, and says
 * where it came from, so the player can show what it is playing from.
 *
 * @param tracks - The tracks.
 * @param source - Where they are from.
 * @param isOrdered - Whether their order matters, as a playlist somebody has ordered does.
 * @param isAnAlbum - Whether they are one album's, and so numbered rather than shown by cover.
 * @param onAlbum - Told to open an album.
 * @param onArtist - Told to open an artist.
 * @param onPlaylist - Told to open a playlist made from a track's menu, where there is somewhere to.
 * @param editing - What moving or taking out a track does, for a playlist of somebody's own.
 */
const ATrackList = ({
  tracks,
  source,
  isOrdered = false,
  isAnAlbum = false,
  onAlbum,
  onArtist,
  onPlaylist,
  editing,
}: ATrackListProps) => {
  const { player, state } = useTheMusic();
  const favourites = useFavourites(useWatchingProfile());
  const cache = useQueryClient();
  const playlists = useQuery(musicQueries.playlists()).data;
  const mine = useMemo(() => (playlists ?? []).filter((playlist) => playlist.isMine), [playlists]);
  const currentId = state.current?.id ?? null;
  const latest = useRef({
    tracks,
    source,
    isOrdered,
    favourites,
    mine,
    onAlbum,
    onArtist,
    onPlaylist,
    editing,
  });

  useLayoutEffect(() => {
    latest.current = {
      tracks,
      source,
      isOrdered,
      favourites,
      mine,
      onAlbum,
      onArtist,
      onPlaylist,
      editing,
    };
  });

  const play = useCallback(
    (at: number) => {
      const now = latest.current;

      player.play(now.tracks, at, { source: now.source, isOrdered: now.isOrdered });
    },
    [player],
  );

  const askAbout = useCallback(
    (at: number) => {
      const now = latest.current;
      const track = now.tracks[at];
      const { editing: changing } = now;

      if (track === undefined) {
        return;
      }

      askAboutATrack({
        track,
        player,
        isLiked: now.favourites.isKept(track.id),
        onLike: () => {
          now.favourites.toggle(track.id);
        },
        onAlbum: now.onAlbum,
        onArtist: now.onArtist,
        playlists: now.mine,
        onPlaylistsChanged: () => {
          void cache.invalidateQueries({ queryKey: musicQueries.key });
        },
        onPlaylist: now.onPlaylist,
        inAPlaylist:
          changing === undefined
            ? undefined
            : {
                canMoveUp: at > 0,
                canMoveDown: at < now.tracks.length - 1,
                onMoveUp: () => {
                  changing.onMove(at, at - 1);
                },
                onMoveDown: () => {
                  changing.onMove(at, at + 1);
                },
                onRemove: () => {
                  changing.onRemove(at);
                },
              },
      });
    },
    [player, cache],
  );

  return (
    <View>
      {tracks.map((track, at) => (
        <ATrackRow
          key={`${track.id}:${at.toString()}`}
          track={track}
          at={at}
          number={isAnAlbum ? (track.trackNumber ?? at + 1) : null}
          artwork={
            isAnAlbum || !track.album.hasArtwork
              ? null
              : onThisServer(albumArtworkUrl(track.album.id))
          }
          isCurrent={currentId === track.id}
          isLiked={favourites.isKept(track.id)}
          onPlay={play}
          onMenu={askAbout}
        />
      ))}
    </View>
  );
};

ATrackList.displayName = 'ATrackList';

export { ATrackList };
