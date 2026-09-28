import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Record } from '@keyline-icons/react-native';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { askForMedia } from '@ValenceClient/requests/fetchMediaRequests';
import { RELEASE_TYPE_NAMES } from '@ValenceClient/requests/RELEASE_TYPE_NAMES';
import { useMayRequest } from '@ValenceClient/requests/useMayRequest';
import { AMusicTile } from '@ValenceMobile/components/AMusicTile/AMusicTile';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { pictureOnThisServer } from '@ValenceMobile/platform/pictureOnThisServer';
import type { MissingAlbum } from '@ValenceContracts/schemas/ArtistStory';
import type { AnArtistStoryProps } from './AnArtistStory.types';

const LINES_AT_FIRST = 6;

const styles = StyleSheet.create({
  story: { alignItems: 'flex-start', gap: 8 },
});

/**
 * What an artist's screen says beneath their music, as the web's artist page does: a few sentences
 * about them from the Wikipedia article they are linked to, cut short at first with a way to read
 * the rest, and — for whoever may ask for music — their albums and EPs the library does not have
 * yet, each of which asks for itself once somebody says so. Nothing is drawn where there is nothing
 * to say.
 *
 * @param artistId - The artist.
 * @param name - What they are called.
 */
const AnArtistStory = ({ artistId, name }: AnArtistStoryProps) => {
  const cache = useQueryClient();
  const story = useQuery(musicQueries.artistStory(artistId));
  const mayRequest = useMayRequest();
  const [isWhole, setIsWhole] = useState(false);
  const bio = story.data?.bio ?? null;
  const missing = mayRequest ? (story.data?.missing ?? []) : [];

  /**
   * Asks, once somebody says so, for an album the library does not have.
   *
   * @param album - The album.
   */
  const offer = (album: MissingAlbum) => {
    Alert.alert(`Request ${album.title}?`, `It is added to your library once it has downloaded.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request',
        onPress: () => {
          void askForMedia({
            kind: 'album',
            musicBrainzId: album.releaseGroupId,
            seasons: null,
            isPickedByHand: false,
          }).then(({ value, refusal }) => {
            if (value === null) {
              Alert.alert(refusal?.message ?? 'That could not be requested.');

              return;
            }

            void cache.invalidateQueries({ queryKey: requestsQueries.key });
            Alert.alert(
              `${album.title} is requested`,
              'You can follow it under Search, Requested.',
            );
          });
        },
      },
    ]);
  };

  return (
    <>
      {missing.length === 0 ? null : (
        <AShelf title={`More from ${name}`}>
          {missing.map((album) => (
            <AMusicTile
              key={album.releaseGroupId}
              title={album.title}
              detail={[
                album.year?.toString(),
                album.type === null ? undefined : RELEASE_TYPE_NAMES[album.type].one,
              ]
                .filter((part) => part !== undefined)
                .join(' · ')}
              artwork={pictureOnThisServer(album.coverUrl)}
              standIn={Record}
              onPress={() => {
                offer(album);
              }}
            />
          ))}
        </AShelf>
      )}

      {bio === null ? null : (
        <View style={styles.story}>
          <Words size="heading">About</Words>
          <Words tone="muted" isProse {...(isWhole ? {} : { lines: LINES_AT_FIRST })}>
            {bio}
          </Words>
          <Button
            tone="ghost"
            onPress={() => {
              setIsWhole((was) => !was);
            }}
          >
            {isWhole ? 'Read less' : 'Read more'}
          </Button>
          <Words size="small" tone="muted">
            From Wikipedia
          </Words>
        </View>
      )}
    </>
  );
};

AnArtistStory.displayName = 'AnArtistStory';

export { AnArtistStory };
