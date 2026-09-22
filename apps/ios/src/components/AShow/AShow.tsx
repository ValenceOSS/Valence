import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Image, Linking, StyleSheet, View } from 'react-native';
import { EyeOff, Film } from 'lucide-react-native';
import { describeAirDate } from '@ValenceCore/functions/describeAirDate';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { laySeasonsOut } from '@ValenceClient/library/laySeasonsOut';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { pickUpFrom } from '@ValenceClient/library/pickUpFrom';
import { useHidden } from '@ValenceClient/library/useHidden';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { AnEpisode } from '@ValencePhone/components/AShow/components/AnEpisode/AnEpisode';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { TheStars } from '@ValencePhone/components/TheStars/TheStars';
import { Words } from '@ValencePhone/components/Words/Words';
import { useConfirmHiding } from '@ValencePhone/hooks/useConfirmHiding';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { AShowProps } from './AShow.types';

const OTHER = 'other';

const styles = StyleSheet.create({
  action: { alignItems: 'center', gap: 4, minWidth: 64 },
  actions: { flexDirection: 'row', gap: 20, justifyContent: 'center' },
  backdrop: { aspectRatio: 16 / 9, borderRadius: 14, width: '100%' },
  missing: { flexDirection: 'row', gap: 12, opacity: 0.55, paddingVertical: 12 },
  missingWords: { flex: 1, gap: 3 },
  number: { minWidth: 28 },
});

/**
 * A programme, as the web's page about one: what it is and how it stands, a button that picks up
 * wherever somebody is in it, its trailer, hiding it, your stars and the household's, and its
 * seasons — the ones the library is missing among them, and each season's missing episodes in
 * their places, with when they air.
 *
 * It opens on the season somebody is part way through, or the one after the last they finished.
 *
 * @param libraryId - The library it is in.
 * @param showId - Which programme.
 * @param onWatch - Told to play an episode, and from where.
 * @param onLookAt - Told to open an episode's own page.
 * @param onBack - Told somebody is done with it.
 */
const AShow = ({ libraryId, showId, onWatch, onLookAt, onBack }: AShowProps) => {
  const asking = useQuery(libraryQueries.show(libraryId, showId));
  const watched = useQuery(viewingQueries.progress());
  const colours = useTheColours();
  const watching = useWatchingProfile();
  const hiding = useHidden(watching);
  const [chosen, setChosen] = useState<number | null | undefined>(undefined);
  const progress = byMediaId(watched.data ?? []);

  useConfirmHiding(hiding, onBack);

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

  const fractionOf = (mediaId: string): number => {
    const known = progress.get(mediaId);

    return known === undefined ? 0 : watchedFraction(known);
  };
  const pickingUp = pickUpFrom(show, {
    resumeFor: (mediaId) => resumeFor(progress, mediaId),
    isFinished: (mediaId) => progress.get(mediaId)?.isFinished === true,
  });
  const today = new Date().toISOString().slice(0, 10);
  const laid = laySeasonsOut(
    show,
    chosen === undefined ? (pickingUp?.episode.seasonNumber ?? null) : chosen,
    today,
  );
  const held = show.seasons.flatMap((season) => season.episodes);
  const isWatchedThrough = held.length > 0 && held.every((episode) => fractionOf(episode.id) >= 1);
  const trailer = (show.extras ?? []).find((extra) => extra.extraKind === 'trailer') ?? null;
  const trailerKey = show.trailerKey ?? null;
  const next = show.nextEpisode ?? null;
  const facts = [
    show.year === null || show.year === undefined ? null : show.year.toString(),
    show.seasonCount === 1
      ? `${show.episodeCount.toString()} episodes`
      : `${show.seasonCount.toString()} seasons · ${show.episodeCount.toString()} episodes`,
    show.status === null || show.status === undefined || show.status === '' ? null : show.status,
    isWatchedThrough ? 'Watched' : null,
  ].filter((fact) => fact !== null);

  return (
    <Screen scrolls>
      <Image
        style={[styles.backdrop, { backgroundColor: colours.surfaceRaised }]}
        source={{ uri: onThisServer(`/api/media/${show.coverMediaId}/image/backdrop`) }}
        accessibilityIgnoresInvertColors
      />

      <Words size="title">{show.title}</Words>

      <Words tone="muted">{facts.join(' · ')}</Words>

      {(show.genres ?? []).length === 0 ? null : (
        <Words size="small" tone="muted">
          {(show.genres ?? []).join(', ')}
        </Words>
      )}

      {next === null ? null : (
        <Words tone="accent">
          {`Next: S${next.seasonNumber.toString()} E${next.episodeNumber.toString()} · ${describeAirDate(next.airDate, today)}`}
        </Words>
      )}

      {pickingUp === null ? null : (
        <Button
          onPress={() => {
            onWatch(pickingUp.episode.id, pickingUp.startSeconds);
          }}
        >
          {`${pickingUp.isResuming ? 'Carry on' : 'Play'} S${(pickingUp.episode.seasonNumber ?? 0).toString()} E${(pickingUp.episode.episodeNumber ?? 0).toString()}`}
        </Button>
      )}

      <View style={styles.actions}>
        {trailer === null && trailerKey === null ? null : (
          <Button
            tone="bare"
            label="Trailer"
            onPress={() => {
              if (trailer !== null) {
                onWatch(trailer.id, 0);

                return;
              }

              if (trailerKey !== null) {
                void Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`);
              }
            }}
          >
            <View style={styles.action}>
              <Icon of={Film} colour={colours.text} />
              <Words size="small">Trailer</Words>
            </View>
          </Button>
        )}

        <Button
          tone="bare"
          label="Hide"
          onPress={() => {
            hiding.ask({
              id: show.coverMediaId,
              title: show.title,
              seriesId: show.seriesId,
              seriesTitle: show.title,
            });
          }}
        >
          <View style={styles.action}>
            <Icon of={EyeOff} colour={colours.text} />
            <Words size="small">Hide</Words>
          </View>
        </Button>
      </View>

      {show.seriesId === null ? null : <TheStars subject={{ seriesId: show.seriesId }} />}

      {laid.choices.length > 1 ? (
        <SegmentedRow
          label="Season"
          items={laid.choices.map((choice) => ({
            id: choice.seasonNumber === null ? OTHER : choice.seasonNumber.toString(),
            label: nameSeason(choice.seasonNumber),
          }))}
          value={laid.showing === null ? OTHER : laid.showing.toString()}
          onSelect={(id) => {
            setChosen(id === OTHER ? null : Number(id));
          }}
        />
      ) : null}

      <View>
        {laid.rows.map((row) =>
          row.episode === null ? (
            <View key={row.key} style={styles.missing}>
              <View style={styles.number}>
                <Words tone="muted">{row.at}</Words>
              </View>
              <View style={styles.missingWords}>
                <Words lines={2}>{row.listed?.title ?? `Episode ${row.at.toString()}`}</Words>
                <Words size="small" tone="muted">
                  {row.airs === '' ? 'Not in the library' : `Not in the library · ${row.airs}`}
                </Words>
              </View>
            </View>
          ) : (
            <AnEpisode
              key={row.key}
              episode={row.episode}
              watched={fractionOf(row.episode.id)}
              airs={row.airs}
              onWatch={() => {
                if (row.episode !== null) {
                  onWatch(row.episode.id, resumeFor(progress, row.episode.id) ?? 0);
                }
              }}
              onLookAt={() => {
                if (row.episode !== null) {
                  onLookAt(row.episode.id);
                }
              }}
            />
          ),
        )}
      </View>

      <Button tone="quiet" onPress={onBack}>
        Back
      </Button>
    </Screen>
  );
};

AShow.displayName = 'AShow';

export { AShow };
