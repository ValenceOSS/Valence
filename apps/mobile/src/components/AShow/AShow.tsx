import {
  CircleCheck,
  Download,
  EyeOff,
  ListVideo,
  Plus,
  Share,
  SquarePlay,
} from '@keyline-icons/react-native';
import {
  CircleCheck as CircleCheckFilled,
  Play as PlayFilled,
  Calendar as StatusCalendar,
  CircleCheck as StatusEnded,
  CircleX as StatusCancelled,
  Clock as StatusClock,
  RefreshCw as StatusReturning,
} from '@keyline-icons/react-native/fill';
import { isWatchedThrough } from '@ValenceClient/library/isWatchedThrough';
import { markWatchedInPlace } from '@ValenceClient/playback/markWatchedInPlace';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, StyleSheet, View } from 'react-native';
import { describeAirDate } from '@ValenceCore/functions/describeAirDate';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { isShowMissingEpisodes } from '@ValenceClient/library/isShowMissingEpisodes';
import { laySeasonsOut } from '@ValenceClient/library/laySeasonsOut';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { pickUpFrom } from '@ValenceClient/library/pickUpFrom';
import { useHidden } from '@ValenceClient/library/useHidden';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { waysToDownloadAProgramme } from '@ValenceClient/downloads/waysToDownloadAProgramme';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { AChoiceOfEpisodes } from '@ValenceMobile/components/AShow/components/AChoiceOfEpisodes/AChoiceOfEpisodes';
import { askHowMuchToDownload } from '@ValenceMobile/components/AShow/askHowMuchToDownload';
import { askToKeepAProgrammeOnThisPhone } from '@ValenceMobile/downloads/askToKeepAProgrammeOnThisPhone';
import { AMissingEpisode } from '@ValenceMobile/components/AShow/components/AMissingEpisode/AMissingEpisode';
import { AnEpisode } from '@ValenceMobile/components/AShow/components/AnEpisode/AnEpisode';
import { ATitleHead } from '@ValenceMobile/components/ATitleHead/ATitleHead';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { APluginPanels } from '@ValenceMobile/components/APluginPanels/APluginPanels';
import { TheStars } from '@ValenceMobile/components/TheStars/TheStars';
import { Words } from '@ValenceMobile/components/Words/Words';
import { AShareSheet } from '@ValenceMobile/components/AShareSheet/AShareSheet';
import { useConfirmHiding } from '@ValenceNative/library/useConfirmHiding';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import type { ShareSubject } from '@ValenceClient/sharing/newShareFor.types';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { AShowProps } from './AShow.types';
import { say } from '@ValenceI18n/say';
import { ALikeThisShelf } from '@ValenceMobile/components/ALikeThisShelf/ALikeThisShelf';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import { sayCount } from '@ValenceI18n/sayCount';
import { ABadgeRow } from '@ValenceMobile/components/ABadgeRow/ABadgeRow';
import { TheBadges } from '@ValenceMobile/components/TheBadges/TheBadges';
import { qualityBadges } from '@ValenceClient/library/qualityBadges';
import { describeShowStatus } from '@ValenceClient/library/describeShowStatus';
import type { ShowStatusKind } from '@ValenceClient/library/describeShowStatus';
import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';
import { AChoiceMenu } from '@ValenceMobile/components/AChoiceMenu/AChoiceMenu';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const STATUS_ICONS: Readonly<Record<ShowStatusKind, AGlyph>> = {
  returning: StatusReturning,
  production: StatusClock,
  planned: StatusCalendar,
  ended: StatusEnded,
  cancelled: StatusCancelled,
};

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
 * their places, with when they air — and, for somebody who may ask for programmes, a way to ask for
 * the aired episodes the library is missing.
 *
 * It opens on the season somebody is part way through, or the one after the last they finished.
 *
 * @param libraryId - The library it is in.
 * @param showId - Which programme.
 * @param onWatch - Told to play an episode, and from where.
 * @param onLookAt - Told to open an episode's own page, or a film like this programme.
 * @param onLookAtShow - Told to open a programme like this one.
 * @param onBack - Told somebody is done with it.
 * @param onRequestMore - Told to open the programme's catalogue page to ask for more of it.
 */
const AShow = ({
  libraryId,
  showId,
  onWatch,
  onLookAt,
  onLookAtShow,
  onBack,
  onRequestMore,
}: AShowProps) => {
  const asking = useQuery(libraryQueries.show(libraryId, showId));
  const [sharing, setSharing] = useState<ShareSubject | null>(null);
  const watched = useQuery(viewingQueries.progress());
  const colours = useTheColours();
  const { may } = useWhatIMayDo();
  const mayShare = may('sharing.link');
  const kinds = useRequestableKinds();
  const mayAskForProgrammes = may('requests.ask') && kinds.has('series');
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
        <ASpinner colour={colours.textMuted} />
      </Screen>
    );
  }

  const show = asking.data;

  if (show === undefined || show === null) {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="danger">{say('phone.aShow.thatProgrammeCouldNotBeRead')}</Words>
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
    void markWatchedInPlace(cache, episodes, isWatched).catch(() => null);
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
  const isSeenThrough = isWatchedThrough(show, (mediaId) => fractionOf(mediaId) >= 1, today);
  const trailer = (show.extras ?? []).find((extra) => extra.extraKind === 'trailer') ?? null;
  const trailerKey = show.trailerKey ?? null;
  const next = show.nextEpisode ?? null;
  const tmdbId = show.tmdbId ?? null;
  const facts = [
    show.year === null || show.year === undefined ? null : show.year.toString(),
    sayCount('common.count.seasons', show.seasonCount),
    show.rating === null || show.rating === undefined ? null : `★ ${show.rating.toFixed(1)}`,
  ].filter((fact) => fact !== null);
  const status =
    show.status === null || show.status === undefined ? null : describeShowStatus(show.status);
  const sharpest = held.reduce<(typeof held)[number] | null>(
    (best, episode) =>
      best === null || episode.width * episode.height > best.width * best.height ? episode : best,
    null,
  );
  const badges = [
    ...(isSeenThrough ? [{ label: say('common.watched'), tone: 'accent' as const }] : []),
    ...(status === null
      ? show.status === null || show.status === undefined || show.status === ''
        ? []
        : [{ label: show.status, tone: 'quiet' as const }]
      : [{ label: status.label, tone: status.tone, icon: STATUS_ICONS[status.kind] }]),
    ...(show.genres ?? []).slice(0, 3).map((genre) => ({ label: genre, tone: 'solid' as const })),
  ];

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

      <TheBadges
        badges={
          sharpest === null ? [] : qualityBadges({ ...sharpest, videoRange: sharpest.videoRange })
        }
        rating={
          typeof show.certification === 'string' &&
          show.certification !== '' &&
          typeof show.certificationRegion === 'string'
            ? { certification: show.certification, region: show.certificationRegion }
            : null
        }
      />

      <ABadgeRow badges={badges} />

      {next === null ? null : (
        <Words tone="accent">
          {say('common.nextSSeasonNumberEEpisodeNumberAirDate', {
            seasonNumber: next.seasonNumber.toString(),
            episodeNumber: next.episodeNumber.toString(),
            airDate: describeAirDate(next.airDate, today),
          })}
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
          {say(
            pickingUp.isResuming
              ? 'phone.aShow.carryOnSeasonEpisode'
              : 'phone.aShow.playSeasonEpisode',
            {
              season: (pickingUp.episode.seasonNumber ?? 0).toString(),
              episode: (pickingUp.episode.episodeNumber ?? 0).toString(),
            },
          )}
        </Button>
      )}

      <View style={styles.actions}>
        {trailer === null && trailerKey === null ? null : (
          <Button
            tone="bare"
            label={say('common.trailer')}
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
              <Icon of={SquarePlay} colour={colours.text} />
              <Words size="small">{say('common.trailer')}</Words>
            </View>
          </Button>
        )}

        {seriesId === null || held.length === 0 ? null : (
          <Button
            tone="bare"
            label={say('common.download')}
            onPress={() => {
              void download();
            }}
          >
            <View style={styles.action}>
              <Icon of={Download} colour={colours.text} />
              <Words size="small">{say('common.download')}</Words>
            </View>
          </Button>
        )}

        {seriesId === null || !mayShare ? null : (
          <Button
            tone="bare"
            label={say('common.share')}
            onPress={() => {
              setSharing({ kind: 'series', seriesId, title: show.title });
            }}
          >
            <View style={styles.action}>
              <Icon of={Share} colour={colours.text} />
              <Words size="small">{say('common.share')}</Words>
            </View>
          </Button>
        )}

        <Button
          tone="bare"
          label={say('common.hide')}
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
            <Words size="small">{say('common.hide')}</Words>
          </View>
        </Button>
      </View>

      {onRequestMore === undefined ||
      !mayAskForProgrammes ||
      tmdbId === null ||
      !isShowMissingEpisodes(show, today) ? null : (
        <Button
          tone="quiet"
          icon={Plus}
          onPress={() => {
            onRequestMore(tmdbId);
          }}
        >
          {say('common.requestMore')}
        </Button>
      )}

      <AShareSheet
        subject={sharing}
        onClose={() => {
          setSharing(null);
        }}
      />

      {show.seriesId === null ? null : <TheStars subject={{ seriesId: show.seriesId }} />}

      <View style={styles.episodes}>
        <View style={styles.episodesHead}>
          <Words size="heading">{say('common.episodes')}</Words>

          {laid.choices.length > 1 ? (
            <View style={styles.seasons}>
              <AChoiceMenu
                label={say('common.season')}
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
            label={
              isSeasonWatched ? say('common.markSeasonUnwatched') : say('common.markSeasonWatched')
            }
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
                {isSeasonWatched
                  ? say('common.markSeasonUnwatched')
                  : say('common.markSeasonWatched')}
              </Words>
            </View>
          </Button>
        )}

        {laid.rows.length === 0 ? (
          <ANothingHere
            of={ListVideo}
            title={say('phone.aShow.noEpisodesYet')}
            detail={say('phone.aShow.episodesAppearAsTheyAreScanned')}
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
      <ALikeThisShelf mediaId={show.coverMediaId} onLookAt={onLookAt} onLookAtShow={onLookAtShow} />
      <APluginPanels on="series" subjectId={showId} onLookAt={onLookAt} />
    </Screen>
  );
};

AShow.displayName = 'AShow';

export { AShow };
