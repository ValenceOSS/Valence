import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { AnEpisode } from '@ValencePhone/components/AShow/components/AnEpisode/AnEpisode';
import { theSeasonCalled } from '@ValencePhone/components/AShow/theSeasonCalled';
import { theSeasonToOpenOn } from '@ValencePhone/components/AShow/theSeasonToOpenOn';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { AShowProps } from './AShow.types';

const styles = StyleSheet.create({
  backdrop: { aspectRatio: 16 / 9, borderRadius: 14, width: '100%' },
  episodes: { gap: 2 },
});

/**
 * One programme, its seasons, and the episodes in whichever season is showing.
 *
 * It opens on the season somebody is up to rather than the first, because a person five seasons in
 * came for season five. Seasons are only offered as a choice where there is more than one of them;
 * a programme with a single season is simply its episodes.
 *
 * @param libraryId - Which library it is in.
 * @param showId - Which programme.
 * @param onWatch - Told which episode to play, and from where.
 * @param onBack - Told they are done looking.
 */
const AShow = ({ libraryId, showId, onWatch, onBack }: AShowProps) => {
  const asking = useQuery(libraryQueries.show(libraryId, showId));
  const watched = useQuery(viewingQueries.progress());
  const colours = useTheColours();
  const [chosen, setChosen] = useState<string | null>(null);
  const progress = byMediaId(watched.data ?? []);

  if (asking.isPending) {
    return (
      <Screen centres>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  const show = asking.data;

  if (show === undefined || show === null) {
    return (
      <Screen centres>
        <Words tone="danger">That programme could not be read.</Words>
        <Button tone="quiet" onPress={onBack}>
          Back
        </Button>
      </Screen>
    );
  }

  const keyOf = (seasonNumber: number | null) => String(seasonNumber ?? 'other');
  const opening = theSeasonToOpenOn(show.seasons, progress);
  const showing = show.seasons.find((season) => keyOf(season.seasonNumber) === chosen) ?? opening;

  return (
    <Screen scrolls>
      <Image
        style={[styles.backdrop, { backgroundColor: colours.surfaceRaised }]}
        source={{ uri: onThisServer(`/api/media/${show.coverMediaId}/image/backdrop`) }}
        accessibilityIgnoresInvertColors
      />

      <Words size="title">{show.title}</Words>

      <Words tone="muted">
        {[
          show.year === null || show.year === undefined ? null : String(show.year),
          `${String(show.episodeCount)} episodes`,
        ]
          .filter((said) => said !== null)
          .join('  ·  ')}
      </Words>

      {show.seasons.length > 1 ? (
        <SegmentedRow
          label="Season"
          items={show.seasons.map((season) => ({
            id: keyOf(season.seasonNumber),
            label: theSeasonCalled(season.seasonNumber),
          }))}
          value={showing === null ? null : keyOf(showing.seasonNumber)}
          onSelect={setChosen}
        />
      ) : null}

      <View style={styles.episodes}>
        {(showing?.episodes ?? []).map((episode) => {
          const seen = progress.get(episode.id);

          return (
            <AnEpisode
              key={episode.id}
              episode={episode}
              watched={seen === undefined ? 0 : watchedFraction(seen)}
              onWatch={() => {
                onWatch(episode.id, resumeFor(progress, episode.id) ?? 0);
              }}
            />
          );
        })}
      </View>

      <Button tone="quiet" onPress={onBack}>
        Back
      </Button>
    </Screen>
  );
};

AShow.displayName = 'AShow';

export { AShow };
