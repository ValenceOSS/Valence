import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { AMissingSong } from '@ValenceMobile/components/ATrackList/components/AMissingSong/AMissingSong';
import { ATrackListRow } from '@ValenceMobile/components/ATrackList/components/ATrackListRow/ATrackListRow';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import { trackMenuItems } from '@ValenceMobile/music/trackMenuItems';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import type { ScreenRows } from '@ValenceMobile/components/Screen/Screen.types';
import type { ATrackListMissingSong, ATrackListProps } from './ATrackList.types';

type ARow = { kind: 'track'; at: number } | { kind: 'missing'; song: ATrackListMissingSong };

const NOTHING_MISSING: readonly ATrackListMissingSong[] = [];

/**
 * Lays out a list of tracks as rows, each song the library does not have yet in its place before
 * the track it comes before, for a list to draw or a page to draw only as they come near the
 * screen. Playing from a track hands the whole list to the player, saying where it came from.
 *
 * @param list - The tracks, where they are from, and what can be done with them.
 * @returns How many rows there are, what each is known by, and how to draw each.
 */
const useTrackRows = ({
  tracks,
  source,
  isOrdered = false,
  isAnAlbum = false,
  onAlbum,
  onArtist,
  onPlaylist,
  editing,
  missing = NOTHING_MISSING,
}: Omit<ATrackListProps, 'drawnIn'>): ScreenRows => {
  const { player } = useTheMusic();
  const favourites = useFavourites(useWatchingProfile());
  const cache = useQueryClient();
  const playlists = useQuery(musicQueries.playlists()).data;
  const mine = useMemo(
    () => (playlists ?? []).filter((playlist) => playlist.isMine && !playlist.isSmart),
    [playlists],
  );
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

  const menuOf = useCallback(
    (at: number) => {
      const now = latest.current;
      const track = now.tracks[at];
      const { editing: changing } = now;

      if (track === undefined) {
        return [];
      }

      return trackMenuItems({
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

  const like = useCallback((at: number) => {
    const now = latest.current;
    const track = now.tracks[at];

    if (track !== undefined) {
      now.favourites.toggle(track.id);
    }
  }, []);

  const rows = useMemo((): readonly ARow[] => {
    const before = new Map<number, ATrackListMissingSong[]>();

    for (const song of missing) {
      const at = Math.min(song.before, tracks.length);

      const held = before.get(at);

      if (held === undefined) {
        before.set(at, [song]);
      } else {
        held.push(song);
      }
    }

    const missingAt = (at: number): ARow[] =>
      (before.get(at) ?? []).map((song) => ({ kind: 'missing', song }));

    return [
      ...tracks.flatMap((_, at): ARow[] => [...missingAt(at), { kind: 'track', at }]),
      ...missingAt(tracks.length),
    ];
  }, [tracks, missing]);

  const keyOf = useCallback(
    (row: number): string => {
      const shown = rows[row];

      return shown === undefined
        ? row.toString()
        : shown.kind === 'missing'
          ? shown.song.key
          : `${tracks[shown.at]?.id ?? ''}:${shown.at.toString()}`;
    },
    [rows, tracks],
  );

  const draw = useCallback(
    (row: number) => {
      const shown = rows[row];
      const track = shown?.kind === 'track' ? tracks[shown.at] : undefined;

      if (shown?.kind === 'missing') {
        return (
          <AMissingSong
            title={shown.song.title}
            artist={shown.song.artist}
            hasCover={!isAnAlbum}
            coverUrl={shown.song.coverUrl}
            onChoose={shown.song.onChoose}
            onRemove={shown.song.onRemove}
          />
        );
      }

      if (shown === undefined || track === undefined) {
        return null;
      }

      return (
        <ATrackListRow
          isFirst={shown.at === 0}
          track={track}
          at={shown.at}
          number={isAnAlbum ? (track.trackNumber ?? shown.at + 1) : null}
          artwork={
            isAnAlbum || !track.album.hasArtwork
              ? null
              : onThisServer(albumArtworkUrl(track.album.id))
          }
          isLiked={favourites.isKept(track.id)}
          onPlay={play}
          menuOf={menuOf}
          onLike={like}
        />
      );
    },
    [rows, tracks, isAnAlbum, favourites, play, menuOf, like],
  );

  return useMemo(() => ({ count: rows.length, keyOf, draw }), [rows.length, keyOf, draw]);
};

export { useTrackRows };
