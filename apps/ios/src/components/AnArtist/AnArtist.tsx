import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { MicVocal } from 'lucide-react-native';
import {
  albumArtworkUrl,
  artistImageUrl,
  setArtistFollowed,
} from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicHead } from '@ValencePhone/components/AMusicHead/AMusicHead';
import { AMusicTile } from '@ValencePhone/components/AMusicTile/AMusicTile';
import { AShelf } from '@ValencePhone/components/AShelf/AShelf';
import { ATrackList } from '@ValencePhone/components/ATrackList/ATrackList';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { AnArtistProps } from './AnArtist.types';

const POPULAR_AT_FIRST = 5;

/**
 * One artist, as the web's artist page draws them: their picture, a way to follow them, their
 * most-played tracks — a handful, and the rest on asking — and their albums and the albums they
 * appear on. Playing them plays their popular tracks.
 *
 * @param artistId - Which artist.
 * @param onAlbum - Told to open an album.
 * @param onArtist - Told to open another artist, from a track's menu.
 * @param onBack - Told somebody is done with them.
 */
const AnArtist = ({ artistId, onAlbum, onArtist, onBack }: AnArtistProps) => {
  const colours = useTheColours();
  const cache = useQueryClient();
  const read = useQuery(musicQueries.artist(artistId));
  const { player } = useTheMusic();
  const [isAllOfIt, setIsAllOfIt] = useState(false);

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
        <Words tone="danger">That artist could not be read.</Words>
      </Screen>
    );
  }

  const { artist, albums, appearsOn, popular } = read.data;
  const source = { kind: 'artist' as const, id: artist.id, name: artist.name };
  const shown = isAllOfIt ? popular : popular.slice(0, POPULAR_AT_FIRST);

  /**
   * A shelf of albums, each opening its page.
   *
   * @param title - What the shelf is called.
   * @param shelved - The albums on it.
   * @returns The shelf, or nothing where there are none.
   */
  const shelf = (title: string, shelved: readonly MusicAlbum[]) =>
    shelved.length === 0 ? null : (
      <AShelf title={title}>
        {shelved.map((album) => (
          <AMusicTile
            key={album.id}
            title={album.title}
            detail={album.year === null ? null : album.year.toString()}
            artwork={album.hasArtwork ? onThisServer(albumArtworkUrl(album.id)) : null}
            onPress={() => {
              onAlbum(album.id);
            }}
          />
        ))}
      </AShelf>
    );

  return (
    <Screen scrolls onBack={onBack}>
      <AMusicHead
        kind="Artist"
        title={artist.name}
        detail={`${artist.albumCount.toString()} ${artist.albumCount === 1 ? 'album' : 'albums'}`}
        artwork={artist.hasImage ? onThisServer(artistImageUrl(artist.id)) : null}
        standIn={MicVocal}
        isRound
        canPlay={popular.length > 0}
        onPlay={() => {
          player.play(popular, 0, { source });
        }}
        onShuffle={() => {
          player.play(popular, 0, { source, isShuffled: true });
        }}
      >
        <Button
          tone="ghost"
          onPress={() => {
            void setArtistFollowed(artist.id, !artist.isFavourite).then(async () =>
              cache.invalidateQueries({ queryKey: musicQueries.key }),
            );
          }}
        >
          {artist.isFavourite ? 'Following' : 'Follow'}
        </Button>
      </AMusicHead>

      {popular.length === 0 ? null : (
        <>
          <Words size="heading">Popular</Words>
          <ATrackList tracks={shown} source={source} onAlbum={onAlbum} onArtist={onArtist} />
          {popular.length > POPULAR_AT_FIRST ? (
            <Button
              tone="ghost"
              onPress={() => {
                setIsAllOfIt((was) => !was);
              }}
            >
              {isAllOfIt ? 'Show fewer' : 'Show all'}
            </Button>
          ) : null}
        </>
      )}

      {shelf('Albums', albums)}
      {shelf('Appears on', appearsOn)}
    </Screen>
  );
};

AnArtist.displayName = 'AnArtist';

export { AnArtist };
