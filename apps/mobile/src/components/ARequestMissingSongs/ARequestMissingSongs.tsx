import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { askForEveryAlbum } from '@ValenceClient/requests/askForEveryAlbum';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Toggle } from '@ValenceMobile/components/Toggle/Toggle';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ARequestMissingSongsProps } from './ARequestMissingSongs.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const COVER = 44;

const styles = StyleSheet.create({
  cover: { borderRadius: 6, height: COVER, overflow: 'hidden', width: COVER },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 6 },
  said: { flex: 1, gap: 2 },
});

/**
 * Requests the albums a playlist's missing songs are on, all at once, in the phone's own sheet, as
 * the web's dialog for it does: each album once, found by the server as the sheet opens and switched
 * on where it can be asked for, beside what stands in the way of any that cannot. The server goes on
 * looking if the sheet is put away, and nothing can be requested until every album has been looked
 * for. The quality is asked once, where there is a choice, and every album switched on is asked for
 * at it.
 *
 * @param playlistId - The playlist.
 * @param isOpen - Whether the sheet is up.
 * @param onClose - Told the sheet was put away, or the albums requested.
 * @param onRequested - Told once albums were requested, so what shows requests can be read again.
 */
const ARequestMissingSongs = ({
  playlistId,
  isOpen,
  onClose,
  onRequested,
}: ARequestMissingSongsProps) => {
  const colours = useTheColours();
  const matching = useQuery(requestsQueries.missingAlbums(playlistId, isOpen));
  const albums = matching.data?.albums ?? [];
  const isMatching = matching.data?.isMatching !== false;
  const offered = useQuery(requestsQueries.profilesOnOffer('album', isOpen));
  const choices = offered.data?.forcedId === null ? offered.data.choices : [];
  const [leftOut, setLeftOut] = useState<ReadonlySet<string>>(new Set());
  const [quality, setQuality] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const ticked = [
    ...new Set(
      albums.flatMap((album) =>
        album.found !== null && album.found.standing.status === 'askable' && !leftOut.has(album.key)
          ? [album.found.id]
          : [],
      ),
    ),
  ];
  const looking = albums.filter((album) => !album.isMatched).length;
  const needsQuality = choices.length > 1 && quality === null;

  const send = async () => {
    setIsAsking(true);

    const { asked, refused } = await askForEveryAlbum(ticked, choices.length > 1 ? quality : null);

    setIsAsking(false);
    onRequested();
    onClose();
    Alert.alert(
      sayCount('common.count.albumsRequested', asked),
      refused === 0
        ? say('common.youCanFollowItUnderSearch')
        : sayCount('common.count.albumsCouldNotBeRequested', refused),
    );
  };

  return (
    <ASheet
      isOpen={isOpen}
      title={say('common.requestMissingSongs')}
      closeLabel={say('common.cancel')}
      onClose={onClose}
    >
      <Words tone="muted">{say('common.requestsTheAlbumsTheMissingSongsAreOn')}</Words>

      {choices.length > 1 ? (
        <SegmentedRow
          label={say('common.quality')}
          items={choices.map((choice) => ({ id: choice.id, label: choice.name }))}
          value={quality}
          onSelect={setQuality}
        />
      ) : null}

      {matching.isError ? (
        <Words tone="danger">{say('common.theMissingAlbumsCouldNotBeFound')}</Words>
      ) : null}

      {matching.data === undefined && !matching.isError ? (
        <ActivityIndicator color={colours.textMuted} />
      ) : null}

      <View>
        {albums.map((album) => {
          const { found } = album;
          const title = found?.title ?? album.title;
          const cover = album.coverUrl ?? found?.posterUrl ?? null;
          const standing = found === null ? null : describeStanding(found.standing);

          return (
            <View key={album.key} style={styles.row}>
              <View style={[styles.cover, { backgroundColor: colours.surfaceRaised }]}>
                {cover === null ? null : (
                  <ARemotePicture style={styles.cover} uri={onThisServer(cover)} />
                )}
              </View>

              <View style={styles.said}>
                <Words lines={1}>{title}</Words>
                <Words size="small" tone="muted" lines={1}>
                  {[
                    found?.subtitle ?? album.artist,
                    sayCount('common.count.songs', album.songCount),
                  ].join(' · ')}
                </Words>
              </View>

              {!album.isMatched ? (
                <ActivityIndicator color={colours.textMuted} />
              ) : found === null ? (
                <Words size="small" tone="muted">
                  {say('common.notFound')}
                </Words>
              ) : standing !== null ? (
                <Words size="small" tone="muted">
                  {standing.label}
                </Words>
              ) : (
                <Toggle
                  label={say('common.requestTitle', { title })}
                  isOn={!leftOut.has(album.key)}
                  isDisabled={isAsking}
                  onToggle={(isOn) => {
                    setLeftOut((before) => {
                      const after = new Set(before);

                      if (isOn) {
                        after.delete(album.key);
                      } else {
                        after.add(album.key);
                      }

                      return after;
                    });
                  }}
                />
              )}
            </View>
          );
        })}
      </View>

      {looking === 0 ? null : (
        <Words size="small" tone="muted">
          {sayCount('common.count.stillLookingForAlbums', looking)}
        </Words>
      )}

      <Button
        isBusy={isAsking}
        isDisabled={isMatching || ticked.length === 0 || needsQuality}
        onPress={() => {
          void send();
        }}
      >
        {sayCount('common.count.requestAlbums', ticked.length)}
      </Button>
    </ASheet>
  );
};

ARequestMissingSongs.displayName = 'ARequestMissingSongs';

export { ARequestMissingSongs };
