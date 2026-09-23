import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { ListMusic } from 'lucide-react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicHead } from '@ValencePhone/components/AMusicHead/AMusicHead';
import { ATrackList } from '@ValencePhone/components/ATrackList/ATrackList';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { Words } from '@ValencePhone/components/Words/Words';
import { howLongItRuns } from '@ValencePhone/components/ATitle/howLongItRuns';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { APlaylistProps } from './APlaylist.types';

/**
 * One playlist, as the web's playlist page draws it: the cover of its first album, whose it is and
 * how long it runs, a way to play it, and its tracks in its order. A track whose file has gone
 * from the library is left out, as the web leaves it out, rather than listed and refusing to play.
 *
 * @param playlistId - Which playlist.
 * @param onAlbum - Told to open an album.
 * @param onArtist - Told to open an artist.
 * @param onBack - Told somebody is done with it.
 */
const APlaylist = ({ playlistId, onAlbum, onArtist, onBack }: APlaylistProps) => {
  const colours = useTheColours();
  const read = useQuery(musicQueries.playlist(playlistId));
  const { player } = useTheMusic();

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
        <Words tone="danger">That playlist could not be read.</Words>
      </Screen>
    );
  }

  const { playlist, entries } = read.data;
  const tracks = entries.flatMap((entry) =>
    entry.item === null || entry.item.track === null ? [] : [entry.item.track],
  );
  const cover = playlist.artworkAlbumIds[0] ?? null;
  const source = { kind: 'playlist' as const, id: playlist.id, name: playlist.name };
  const detail = [
    playlist.isMine || playlist.owner === null ? null : playlist.owner.name,
    `${tracks.length.toString()} ${tracks.length === 1 ? 'song' : 'songs'}`,
    howLongItRuns(playlist.durationSeconds),
  ].filter((part) => part !== null);

  return (
    <Screen scrolls onBack={onBack}>
      <AMusicHead
        kind="Playlist"
        title={playlist.name}
        detail={detail.join(' · ')}
        artwork={cover === null ? null : onThisServer(albumArtworkUrl(cover))}
        standIn={ListMusic}
        canPlay={tracks.length > 0}
        onPlay={() => {
          player.play(tracks, 0, { source, isOrdered: playlist.isOrdered });
        }}
        onShuffle={() => {
          player.play(tracks, 0, { source, isShuffled: true });
        }}
      >
        {playlist.description === null ? null : (
          <Words tone="muted" isCentred>
            {playlist.description}
          </Words>
        )}
      </AMusicHead>

      <ATrackList
        tracks={tracks}
        source={source}
        isOrdered={playlist.isOrdered}
        onAlbum={onAlbum}
        onArtist={onArtist}
      />
    </Screen>
  );
};

APlaylist.displayName = 'APlaylist';

export { APlaylist };
