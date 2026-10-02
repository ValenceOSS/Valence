import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleCheck, EyeOff, RotateCcw, Star } from '@keyline-icons/react-native';
import { Play } from '@keyline-icons/react-native/fill';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { pickUpFrom } from '@ValenceClient/library/pickUpFrom';
import { qualityBadges } from '@ValenceClient/library/qualityBadges';
import { useHidden } from '@ValenceClient/library/useHidden';
import { useRate } from '@ValenceClient/library/useRate';
import { useStars } from '@ValenceClient/library/useStars';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { markWatched } from '@ValenceClient/playback/markWatched';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { EpisodeCard } from '@ValenceTv/components/EpisodeCard/EpisodeCard';
import { TabBar } from '@ValenceTv/components/TabBar/TabBar';
import { TitleSpread } from '@ValenceTv/components/TitleSpread/TitleSpread';
import { PluginPanels } from '@ValenceTv/components/PluginPanels/PluginPanels';
import { StarChoice } from '@ValenceTv/components/StarChoice/StarChoice';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { useConfirmHiding } from '@ValenceNative/library/useConfirmHiding';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { useProgress } from '@ValenceTv/library/useProgress';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';
import type { ShowPageProps } from './ShowPage.types';
import { placeOfEpisode } from '@ValenceTv/library/placeOfEpisode';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const STARRING = 4;

/**
 * How a season is keyed in the row of seasons, where a season without a number is kept apart.
 *
 * @param seasonNumber - The season.
 * @returns Its key.
 */
const seasonKey = (seasonNumber: number | null): string =>
  seasonNumber === null ? 'other' : seasonNumber.toString();

/**
 * What the catalogue says happens in an episode, where it says anything.
 *
 * @param show - The programme, with the catalogue's view of its seasons.
 * @param episode - The episode.
 * @returns What happens in it, or nothing.
 */
const overviewOf = (show: ShowDetail, episode: MediaSummary): string | null =>
  show.shape
    ?.find((season) => season.seasonNumber === episode.seasonNumber)
    ?.episodes.find((one) => one.episodeNumber === episode.episodeNumber)?.overview ?? null;

/**
 * A programme's own page: everything about it beside its picture, the episode this viewer would
 * carry on with and what happens in it, the ways to watch — carry on, or start from the first — and
 * beneath, its seasons, landing on one showing its episodes. Each season's row starts from its
 * first episode, rather than wherever the last season's was left. The programme can be given stars
 * from the panel down the right, which Menu closes, or hidden, once asked.
 *
 * @param libraryId - The library the programme is in.
 * @param showId - The programme.
 * @param viewerId - Who is watching, whose stars and hiding they are.
 * @param onPlay - Told to play an episode, and from where.
 */
const ShowPage = ({ libraryId, showId, viewerId, onPlay }: ShowPageProps) => {
  const { progress } = useProgress();
  const asked = useQuery(libraryQueries.show(libraryId, showId));
  const show = asked.data ?? null;
  const seriesId = show?.seriesId ?? null;
  const hiding = useHidden(viewerId);
  const rate = useRate(viewerId);
  const stars = useStars(viewerId, { seriesId: seriesId ?? '' });
  const [isRating, setIsRating] = useState(false);

  useConfirmHiding(hiding);
  useMenuButton(
    isRating
      ? () => {
          setIsRating(false);
        }
      : null,
    true,
  );
  const cover = useQuery(libraryQueries.detail(show?.coverMediaId ?? null));
  const [chosen, setChosen] = useState<string | null>(null);
  const cache = useQueryClient();

  if (show === null) {
    return (
      <View style={styles.waiting}>
        {asked.isPending ? (
          <ActivityIndicator size="large" color={tokens.colours.text} />
        ) : (
          <Text style={styles.problem}>{say('tv.showPage.thisProgrammeCouldNotBeFound')}</Text>
        )}
      </View>
    );
  }

  const carryingOn = pickUpFrom(show, {
    resumeFor: (mediaId) => resumeFor(progress, mediaId),
    isFinished: (mediaId) => progress.get(mediaId)?.isFinished === true,
  });

  const seasons = show.seasons.map((season) => ({
    id: seasonKey(season.seasonNumber),
    label: nameSeason(season.seasonNumber),
    episodes: season.episodes,
  }));

  const first = seasons[0]?.episodes[0] ?? null;

  const current =
    chosen ??
    (carryingOn === null
      ? (seasons[0]?.id ?? '')
      : seasonKey(carryingOn.episode.seasonNumber ?? null));

  const episodes = seasons.find((season) => season.id === current)?.episodes ?? [];
  const starring = (cover.data?.metadata.cast ?? []).slice(0, STARRING).map((one) => one.name);
  const genres = show.genres ?? [];
  const watched = carryingOn === null ? undefined : progress.get(carryingOn.episode.id);
  const isSeasonWatched =
    episodes.length > 0 && episodes.every((one) => progress.get(one.id)?.isFinished === true);

  /**
   * Marks episodes watched, or unwatched again, and reads progress and the shelves again so the
   * cards and the count of what is left follow.
   *
   * @param which - The episodes.
   * @param isWatched - Whether they are now watched.
   */
  const mark = (which: readonly MediaSummary[], isWatched: boolean) => {
    void markWatched(which, isWatched)
      .then(async () =>
        Promise.all([
          cache.invalidateQueries({ queryKey: viewingQueries.progress().queryKey }),
          cache.invalidateQueries({ queryKey: libraryQueries.key }),
        ]),
      )
      .catch(() => null);
  };

  const page = (
    <TitleSpread
      mediaId={show.coverMediaId}
      name={show.title}
      hasLogo={cover.data?.metadata.hasLogo ?? false}
      stillPath={artworkUrl(show.coverMediaId, 'backdrop', { isOfTitle: true })}
      facts={joinFacts([
        show.year?.toString(),
        sayCount('common.count.seasons', show.seasonCount),
        typeof show.rating === 'number' ? `★ ${show.rating.toFixed(1)}` : null,
      ])}
      badges={cover.data === undefined || cover.data === null ? [] : qualityBadges(cover.data)}
      tagline={
        carryingOn === null
          ? null
          : `${placeOfEpisode(carryingOn.episode)} · ${carryingOn.episode.title}`
      }
      overview={
        show.overview ?? (carryingOn === null ? null : overviewOf(show, carryingOn.episode))
      }
      credits={[
        ...(starring.length === 0
          ? []
          : [say('common.starringValue', { value: starring.join(', ') })]),
        ...(genres.length === 0 ? [] : [genres.join(', ')]),
      ]}
      below={
        <View style={styles.below}>
          {seasons.length > 1 ? (
            <View style={styles.seasons}>
              <TabBar tabs={seasons} current={current} onChoose={setChosen} />
            </View>
          ) : (
            <Text style={styles.heading}>{say('common.episodes')}</Text>
          )}

          <FlatList
            key={current}
            horizontal
            data={episodes}
            keyExtractor={(episode) => episode.id}
            showsHorizontalScrollIndicator={false}
            style={styles.row}
            contentContainerStyle={styles.inside}
            renderItem={({ item }) => {
              const seen = progress.get(item.id);

              return (
                <EpisodeCard
                  episode={item}
                  overview={overviewOf(show, item)}
                  isWatched={seen?.isFinished === true}
                  onPress={(episode) => {
                    onPlay(episode, resumeFor(progress, episode.id) ?? 0);
                  }}
                  onHold={(episode) => {
                    mark([episode], progress.get(episode.id)?.isFinished !== true);
                  }}
                  {...(seen === undefined ? {} : { watchedFraction: watchedFraction(seen) })}
                />
              );
            }}
          />

          <PluginPanels on="series" subjectId={showId} />
        </View>
      }
    >
      {carryingOn === null ? null : (
        <ActionRow
          label={
            carryingOn.isResuming
              ? say('tv.showPage.resumeEpisodeFromStartSeconds', {
                  episode: placeOfEpisode(carryingOn.episode),
                  startSeconds: formatDuration(carryingOn.startSeconds),
                })
              : say('tv.showPage.playEpisode', { episode: placeOfEpisode(carryingOn.episode) })
          }
          icon={Play}
          hasPreferredFocus
          onPress={() => {
            onPlay(carryingOn.episode, carryingOn.startSeconds);
          }}
          {...(carryingOn.isResuming && watched !== undefined
            ? { watchedFraction: watchedFraction(watched) }
            : {})}
        />
      )}

      {episodes.length === 0 ? null : (
        <ActionRow
          label={
            isSeasonWatched
              ? seasons.length > 1
                ? say('tv.showPage.markThisSeasonUnwatched')
                : say('tv.showPage.markEveryEpisodeUnwatched')
              : seasons.length > 1
                ? say('tv.showPage.markThisSeasonWatched')
                : say('tv.showPage.markEveryEpisodeWatched')
          }
          icon={CircleCheck}
          onPress={() => {
            mark(episodes, !isSeasonWatched);
          }}
        />
      )}

      {first === null || carryingOn === null || carryingOn.episode.id === first.id ? null : (
        <ActionRow
          label={say('tv.showPage.playFromTheFirstEpisode')}
          icon={RotateCcw}
          onPress={() => {
            onPlay(first, 0);
          }}
        />
      )}

      {seriesId === null ? null : (
        <ActionRow
          label={stars === null ? say('tv.rating.rateIt') : say('common.yourRating')}
          {...(stars === null ? {} : { detail: sayCount('common.count.stars', stars) })}
          icon={Star}
          onPress={() => {
            setIsRating(true);
          }}
        />
      )}

      {seriesId === null ? null : (
        <ActionRow
          label={say('common.hide')}
          icon={EyeOff}
          onPress={() => {
            hiding.ask({
              id: show.coverMediaId,
              title: show.title,
              seriesId,
              seriesTitle: show.title,
            });
          }}
        />
      )}
    </TitleSpread>
  );

  return (
    <View style={styles.page}>
      {page}

      {isRating && seriesId !== null ? (
        <StarChoice
          title={show.title}
          given={stars}
          onChoose={(chosen) => {
            rate({ seriesId }, chosen);
            setIsRating(false);
          }}
        />
      ) : null}
    </View>
  );
};

ShowPage.displayName = 'ShowPage';

const styles = StyleSheet.create({
  page: { flex: 1 },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  problem: { color: tokens.colours.muted, fontSize: tokens.type.body },
  below: { gap: tokens.space.sm, paddingBottom: tokens.space.xl },
  seasons: { paddingHorizontal: tokens.space.edge },
  heading: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingHorizontal: tokens.space.edge,
  },
  row: { overflow: 'visible' },
  inside: {
    paddingHorizontal: tokens.space.edge,
    paddingVertical: tokens.space.md,
    gap: tokens.space.md,
  },
});

export { ShowPage };
