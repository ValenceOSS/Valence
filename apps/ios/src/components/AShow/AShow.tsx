import { CircleCheck, Download, EyeOff, Film, ListVideo, Share } from '@keyline-icons/react-native';
import {
  CircleCheck as CircleCheckFilled,
  Play as PlayFilled,
} from '@keyline-icons/react-native/fill';
import { markWatched } from '@ValenceClient/playback/markWatched';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { describeAirDate } from '@ValenceCore/functions/describeAirDate';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { laySeasonsOut } from '@ValenceClient/library/laySeasonsOut';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { pickUpFrom } from '@ValenceClient/library/pickUpFrom';
import { useHidden } from '@ValenceClient/library/useHidden';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { waysToDownloadAProgramme } from '@ValenceClient/downloads/waysToDownloadAProgramme';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { AChoiceOfEpisodes } from '@ValencePhone/components/AShow/components/AChoiceOfEpisodes/AChoiceOfEpisodes';
import { askHowMuchToDownload } from '@ValencePhone/components/AShow/askHowMuchToDownload';
import { askToKeepAProgrammeOnThisPhone } from '@ValencePhone/downloads/askToKeepAProgrammeOnThisPhone';
import { AMissingEpisode } from '@ValencePhone/components/AShow/components/AMissingEpisode/AMissingEpisode';
import { AnEpisode } from '@ValencePhone/components/AShow/components/AnEpisode/AnEpisode';
import { ATitleHead } from '@ValencePhone/components/ATitleHead/ATitleHead';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { TheStars } from '@ValencePhone/components/TheStars/TheStars';
import { Words } from '@ValencePhone/components/Words/Words';
import { AShareSheet } from '@ValencePhone/components/AShareSheet/AShareSheet';
import { useConfirmHiding } from '@ValencePhone/hooks/useConfirmHiding';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { ANothingHere } from '@ValencePhone/components/ANothingHere/ANothingHere';
import type { ShareSubject } from '@ValenceClient/sharing/newShareFor.types';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { AShowProps } from './AShow.types';

const OTHER = 'other';

const styles = StyleSheet.create({
  action: { alignItems: 'center', gap: 4, minWidth: 64 },
  actions: { flexDirection: 'row', gap: 20, justifyContent: 'center' },
  divided: { borderTopWidth: StyleSheet.hairlineWidth },
  episodes: { gap: 8 },
  episodesHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  seasons: { flexShrink: 1 },
  markSeason: { alignItems: 'center', flexDirection: 'row', gap: 6, paddingVertical: 6 },
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
  const [sharing, setSharing] = useState<ShareSubject | null>(null);
  const watched = useQuery(viewingQueries.progress());
  const colours = useTheColours();
  const watching = useWatchingProfile();
  const hiding = useHidden(watching);
  const [chosen, setChosen] = useState<number | null | undefined>(undefined);
  const [isChoosing, setIsChoosing] = useState(false);
  const cache = useQueryClient();
  const onThisPhone = new Set(useHeldFiles().map((file) => file.mediaId));
  const progress = byMediaId(watched.data ?? []);

  useConfirmHiding(hiding, onBack);

  if (asking.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  const show = asking.data;

  if (show === undefined || show === null) {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="danger">That programme could not be read.</Words>
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
  const seriesId = show.seriesId ?? null;
  const shown = laid.rows.flatMap((row) => (row.episode === null ? [] : [row.episode]));
  const isSeasonWatched = shown.length > 0 && shown.every((episode) => fractionOf(episode.id) >= 1);

  /**
   * Marks episodes watched, or unwatched again, and reads progress and the shelves again so the
   * ticks and the count of what is left follow.
   *
   * @param episodes - The episodes.
   * @param isWatched - Whether they are now watched.
   */
  const mark = (episodes: readonly MediaSummary[], isWatched: boolean) => {
    void markWatched(episodes, isWatched)
      .then(async () =>
        Promise.all([
          cache.invalidateQueries({ queryKey: viewingQueries.progress().queryKey }),
          cache.invalidateQueries({ queryKey: libraryQueries.key }),
        ]),
      )
      .catch(() => null);
  };

  /**
   * Asks the server to prepare the episodes wanted, leaving out what this phone already has, and
   * reads the downloads again so the rows say so.
   *
   * @param mediaIds - The episodes wanted.
   */
  const keep = async (mediaIds: readonly string[]) => {
    if (seriesId === null) {
      return;
    }

    const wanted = mediaIds.filter((id) => !onThisPhone.has(id));

    if (await askToKeepAProgrammeOnThisPhone(seriesId, show.title, wanted)) {
      await cache.invalidateQueries({ queryKey: downloadQueries.all().queryKey });
    }
  };

  /**
   * Offers the season on screen, every season or picking, and follows whichever was chosen.
   */
  const download = async () => {
    const way = await askHowMuchToDownload(
      show.title,
      waysToDownloadAProgramme(show, laid.showing),
    );

    if (way === null) {
      return;
    }

    if (way.kind === 'choose') {
      setIsChoosing(true);

      return;
    }

    await keep(way.mediaIds ?? held.map((episode) => episode.id));
  };
  const isWatchedThrough = held.length > 0 && held.every((episode) => fractionOf(episode.id) >= 1);
  const trailer = (show.extras ?? []).find((extra) => extra.extraKind === 'trailer') ?? null;
  const trailerKey = show.trailerKey ?? null;
  const next = show.nextEpisode ?? null;
  const facts = [
    show.year === null || show.year === undefined ? null : show.year.toString(),
    show.seasonCount === 1 ? '1 season' : `${show.seasonCount.toString()} seasons`,
    show.rating === null || show.rating === undefined ? null : `★ ${show.rating.toFixed(1)}`,
    (show.genres ?? []).length === 0 ? null : (show.genres ?? []).slice(0, 2).join(', '),
    show.status === null || show.status === undefined || show.status === '' ? null : show.status,
    isWatchedThrough ? 'Watched' : null,
  ].filter((fact) => fact !== null);

  return (
    <Screen
      scrolls
      title={show.title}
      onBack={onBack}
      head={
        <ATitleHead
          mediaId={show.coverMediaId}
          hasBackdrop
          letteredBy={held.find((episode) => episode.hasLogo)?.id ?? null}
          title={show.title}
        />
      }
    >
      <Words tone="muted">{facts.join(' · ')}</Words>

      {next === null ? null : (
        <Words tone="accent">
          {`Next: S${next.seasonNumber.toString()} E${next.episodeNumber.toString()} · ${describeAirDate(next.airDate, today)}`}
        </Words>
      )}

      {pickingUp === null ? null : (
        <Button
          tone="bold"
          icon={PlayFilled}
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

        {seriesId === null || held.length === 0 ? null : (
          <Button
            tone="bare"
            label="Download"
            onPress={() => {
              void download();
            }}
          >
            <View style={styles.action}>
              <Icon of={Download} colour={colours.text} />
              <Words size="small">Download</Words>
            </View>
          </Button>
        )}

        {seriesId === null ? null : (
          <Button
            tone="bare"
            label="Share"
            onPress={() => {
              setSharing({ kind: 'series', seriesId, title: show.title });
            }}
          >
            <View style={styles.action}>
              <Icon of={Share} colour={colours.text} />
              <Words size="small">Share</Words>
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

      <AShareSheet
        subject={sharing}
        onClose={() => {
          setSharing(null);
        }}
      />

      {show.seriesId === null ? null : <TheStars subject={{ seriesId: show.seriesId }} />}

      <View style={styles.episodes}>
        <View style={styles.episodesHead}>
          <Words size="heading">Episodes</Words>

          {laid.choices.length > 1 ? (
            <View style={styles.seasons}>
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
            </View>
          ) : null}
        </View>

        {shown.length === 0 ? null : (
          <Button
            tone="bare"
            label={isSeasonWatched ? 'Mark season unwatched' : 'Mark season watched'}
            onPress={() => {
              mark(shown, !isSeasonWatched);
            }}
          >
            <View style={styles.markSeason}>
              <Icon
                of={isSeasonWatched ? CircleCheckFilled : CircleCheck}
                size={16}
                colour={colours.textMuted}
              />
              <Words size="small" tone="muted">
                {isSeasonWatched ? 'Mark season unwatched' : 'Mark season watched'}
              </Words>
            </View>
          </Button>
        )}

        {laid.rows.length === 0 ? (
          <ANothingHere
            of={ListVideo}
            title="No episodes yet"
            detail="Episodes appear as they are scanned."
          />
        ) : (
          <View>
            {laid.rows.map((row, place) => (
              <View
                key={row.key}
                style={place === 0 ? null : [styles.divided, { borderTopColor: colours.border }]}
              >
                {row.episode === null ? (
                  <AMissingEpisode
                    at={row.at}
                    title={row.listed?.title ?? null}
                    stillUrl={row.listed?.stillUrl ?? null}
                    airs={row.airs}
                  />
                ) : (
                  <AnEpisode
                    episode={row.episode}
                    watched={fractionOf(row.episode.id)}
                    resumeSeconds={resumeFor(progress, row.episode.id)}
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
                    onMarkWatched={() => {
                      if (row.episode !== null) {
                        mark([row.episode], fractionOf(row.episode.id) < 1);
                      }
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <AChoiceOfEpisodes
        isOpen={isChoosing}
        seasons={show.seasons}
        held={onThisPhone}
        onClose={() => {
          setIsChoosing(false);
        }}
        onChosen={(mediaIds) => {
          setIsChoosing(false);
          void keep(mediaIds);
        }}
      />
    </Screen>
  );
};

AShow.displayName = 'AShow';

export { AShow };
