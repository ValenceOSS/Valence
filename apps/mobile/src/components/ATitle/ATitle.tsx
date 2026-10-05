import {
  ChevronsUpDown,
  CircleCheck,
  Download,
  Film,
  Heart,
  ListVideo,
  MoreHorizontal,
  RotateCcw,
  Share,
} from '@keyline-icons/react-native';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';
import { APlayOnSheet } from '@ValenceMobile/components/APlayOnSheet/APlayOnSheet';
import { describeTimeToGo } from '@ValenceCore/functions/describeTimeToGo';
import { Heart as HeartFilled, Play as PlayFilled } from '@keyline-icons/react-native/fill';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { markWatched } from '@ValenceClient/playback/markWatched';
import { askAboutATitle } from '@ValenceMobile/components/ATitle/askAboutATitle';
import { qualityBadges } from '@ValenceClient/library/qualityBadges';
import { theVersionsOf } from '@ValenceClient/library/theVersionsOf';
import { describeTitleDetails } from '@ValenceClient/library/describeTitleDetails';
import { ATomatoMark } from '@ValenceMobile/components/ATomatoMark/ATomatoMark';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useHidden } from '@ValenceClient/library/useHidden';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { EXTRA_KIND_LABELS } from '@ValenceContracts/schemas/Library';
import { APoster } from '@ValenceMobile/components/APoster/APoster';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { ATitleHead } from '@ValenceMobile/components/ATitleHead/ATitleHead';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { APluginPanels } from '@ValenceMobile/components/APluginPanels/APluginPanels';
import { TheBadges } from '@ValenceMobile/components/TheBadges/TheBadges';
import { TheCast } from '@ValenceMobile/components/TheCast/TheCast';
import { TheStars } from '@ValenceMobile/components/TheStars/TheStars';
import { Words } from '@ValenceMobile/components/Words/Words';
import { AShareSheet } from '@ValenceMobile/components/AShareSheet/AShareSheet';
import { howLongItRuns } from '@ValenceMobile/components/ATitle/howLongItRuns';
import { askWhichVersion } from '@ValenceMobile/components/ATitle/askWhichVersion';
import { useConfirmHiding } from '@ValenceNative/library/useConfirmHiding';
import { askToKeepOnThisPhone } from '@ValenceMobile/downloads/askToKeepOnThisPhone';
import { useTheProgrammeOfEpisode } from '@ValenceClient/library/useTheProgrammeOfEpisode';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import { whereFrom } from '@ValenceClient/linking/whereFrom';
import { usePreferredCopy } from '@ValenceClient/linking/usePreferredCopy';
import type { ShareSubject } from '@ValenceClient/sharing/newShareFor.types';
import type { ATitleProps } from './ATitle.types';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { say } from '@ValenceI18n/say';
import { ABadgeRow } from '@ValenceMobile/components/ABadgeRow/ABadgeRow';

const PLAY_HEIGHT = 46;

const styles = StyleSheet.create({
  about: { gap: 8 },
  action: { alignItems: 'center', gap: 4, minWidth: 76 },
  actions: {
    columnGap: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 16,
  },
  again: { alignItems: 'center', borderRadius: 12, justifyContent: 'center' },
  detail: { gap: 2, width: '47%' },
  detailValue: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  details: { columnGap: 12, flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  facts: { gap: 8 },
  play: { flex: 1 },
  playing: { alignItems: 'center', flexDirection: 'row', gap: 10 },
});

/**
 * Everything about one film or episode, as the web's page about it: its artwork, what it is, a way
 * to watch it — from the start, from where somebody stopped, or in another version — and the rest:
 * favouriting it, downloading it to the phone, rating it, its trailer, hiding it, who is in it, the
 * details the catalogue knows and whatever extras came with it.
 *
 * An episode offers its programme, found in its library by name, since that is what an episode
 * knows of it.
 *
 * @param mediaId - Which title.
 * @param onWatch - Told to play something, and from where.
 * @param onLookAtPerson - Told whose page to open.
 * @param onLookAtShow - Told to open a programme.
 * @param onBack - Told somebody is done with it.
 * @param onStartParty - Told to start a watch party on what is about to play, where this phone can.
 */
const ATitle = ({
  mediaId,
  onWatch,
  onLookAtPerson,
  onLookAtShow,
  onBack,
  onStartParty,
}: ATitleProps) => {
  const asking = useQuery(libraryQueries.detail(mediaId));
  const watched = useQuery(viewingQueries.progress());
  const colours = useTheColours();
  const watching = useWatchingProfile();
  const favourites = useFavourites(watching);
  const hiding = useHidden(watching);
  const cache = useQueryClient();
  const held = useHeldFiles().find((file) => file.mediaId === mediaId) ?? null;
  const [sharing, setSharing] = useState<ShareSubject | null>(null);
  const [isPlayingOn, setIsPlayingOn] = useState(false);
  const hasTelevision = useVideoDevices().some((device) => device.kind === 'tv');
  const preparing =
    useQuery(downloadQueries.all()).data?.find(
      (download) => download.mediaId === mediaId && download.state === 'preparing',
    ) ?? null;
  const [version, setVersion] = useState<string | null>(null);
  const [playHeight, setPlayHeight] = useState(PLAY_HEIGHT);
  const title = asking.data;
  const seriesTitle = title?.metadata.seriesTitle ?? null;
  const programme = useTheProgrammeOfEpisode(mediaId);
  const originOf = useOriginOf();
  const copies = title?.versions ?? [];
  const preferred = usePreferredCopy(title, copies);
  const playing = version ?? preferred ?? mediaId;
  const playingElsewhere = copies.find((copy) => copy.id === playing);
  const isWatched =
    (watched.data ?? []).find((entry) => entry.mediaId === mediaId)?.isFinished === true;
  const carryOnAt = resumeFor(
    byMediaId(watched.data ?? []),
    playingElsewhere !== undefined && originOf(playingElsewhere.libraryId) !== null
      ? mediaId
      : playing,
  );

  useConfirmHiding(hiding, onBack);

  if (asking.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  if (title === undefined || title === null) {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="danger">{say('common.thatTitleCouldNotBeRead')}</Words>
      </Screen>
    );
  }

  const { metadata } = title;
  const versions = title.versions ?? [];
  const extras = (title.extras ?? []).filter((extra) => extra.id !== mediaId);
  const trailer = extras.find((extra) => extra.extraKind === 'trailer') ?? null;
  const trailerKey = title.trailerKey ?? null;
  const isKept = favourites.isKept(mediaId);
  const facts = [
    metadata.seasonNumber === null || metadata.seasonNumber === undefined
      ? null
      : `S${metadata.seasonNumber.toString()}${
          metadata.episodeNumber === null || metadata.episodeNumber === undefined
            ? ''
            : ` E${describeEpisodeNumbers(metadata.episodeNumber, metadata.episodeNumberEnd)}`
        }`,
    title.year === null || title.year === undefined ? null : title.year.toString(),
    howLongItRuns(title.durationSeconds),
    metadata.rating === null || metadata.rating === undefined
      ? null
      : `★ ${metadata.rating.toFixed(1)}`,
  ].filter((fact) => fact !== null);
  const genres = (metadata.genres ?? [])
    .slice(0, 3)
    .map((genre) => ({ label: genre, tone: 'solid' as const }));
  const details = describeTitleDetails(metadata);
  const tagline = seriesTitle === null ? (metadata.tagline ?? null) : null;
  const overview = metadata.overview ?? null;
  const offered = theVersionsOf(mediaId, versions);
  const origin = originOf(title.libraryId);

  return (
    <Screen
      scrolls
      title={title.title}
      onBack={onBack}
      head={
        <ATitleHead
          mediaId={title.id}
          hasBackdrop={metadata.hasBackdrop}
          letteredBy={metadata.hasLogo ? title.id : null}
          title={title.title}
        />
      }
    >
      {seriesTitle === null ? null : <Words size="heading">{title.title}</Words>}

      {origin === null ? null : (
        <Words tone={origin.isReachable ? 'muted' : 'danger'}>{whereFrom(origin)}</Words>
      )}

      <View style={styles.facts}>
        <Words tone="muted">{facts.join(' · ')}</Words>
        <TheBadges
          badges={qualityBadges(title)}
          rating={
            typeof title.metadata.certification === 'string' &&
            title.metadata.certification !== '' &&
            typeof title.metadata.certificationRegion === 'string'
              ? {
                  certification: title.metadata.certification,
                  region: title.metadata.certificationRegion,
                }
              : null
          }
        />
        <ABadgeRow badges={genres} />
      </View>

      {tagline === null && overview === null ? null : (
        <View style={styles.about}>
          {tagline === null ? null : <Words isProse>{tagline}</Words>}
          {overview === null ? null : <Words tone="muted">{overview}</Words>}
        </View>
      )}

      {versions.length === 0 ? null : (
        <Button
          tone="ghost"
          icon={ChevronsUpDown}
          label={say('common.whichVersionToPlay')}
          onPress={() => {
            askWhichVersion(offered, setVersion);
          }}
        >
          {offered.find((one) => one.id === playing)?.label ?? say('common.original')}
        </Button>
      )}

      <View style={styles.playing}>
        <View
          style={styles.play}
          onLayout={({ nativeEvent }) => {
            setPlayHeight(nativeEvent.layout.height);
          }}
        >
          <Button
            tone="bold"
            icon={PlayFilled}
            onPress={() => {
              onWatch(playing, carryOnAt ?? 0);
            }}
          >
            {carryOnAt === null
              ? say('common.play')
              : say('phone.aTitle.resumeFromCarryOnAt', { carryOnAt: howLongItRuns(carryOnAt) })}
          </Button>
        </View>

        {carryOnAt === null ? null : (
          <Button
            tone="bare"
            label={say('common.startAgain')}
            onPress={() => {
              onWatch(playing, 0);
            }}
          >
            <View
              style={[
                styles.again,
                {
                  backgroundColor: withAlpha(colours.text, 0.1),
                  height: playHeight,
                  width: playHeight,
                },
              ]}
            >
              <Icon of={RotateCcw} size={20} colour={colours.text} />
            </View>
          </Button>
        )}
      </View>

      {programme === null ? null : (
        <Button
          tone="ghost"
          isWide
          icon={ListVideo}
          label={say('phone.aTitle.allEpisodesOfTitle', { title: programme.title })}
          onPress={() => {
            onLookAtShow(programme.libraryId, programme.id);
          }}
        >
          {say('phone.aTitle.allEpisodes')}
        </Button>
      )}

      <View style={styles.actions}>
        <Button
          tone="bare"
          label={say('phone.aTitle.favourite')}
          isChosen={isKept}
          onPress={() => {
            favourites.toggle(mediaId);
          }}
        >
          <View style={styles.action}>
            <Icon
              of={isKept ? HeartFilled : Heart}
              colour={isKept ? colours.danger : colours.text}
            />
            <Words size="small">{say('phone.aTitle.favourite')}</Words>
          </View>
        </Button>

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
              <Icon of={Film} colour={colours.text} />
              <Words size="small">{say('common.trailer')}</Words>
            </View>
          </Button>
        )}

        <Button
          tone="bare"
          label={
            held === null
              ? say('common.download')
              : held.state === 'here'
                ? say('common.downloaded')
                : say('common.downloading')
          }
          isDisabled={held !== null || preparing !== null}
          onPress={() => {
            void askToKeepOnThisPhone(mediaId, title.title).then(async (isAsked) => {
              if (isAsked) {
                await cache.invalidateQueries({ queryKey: downloadQueries.all().queryKey });
              }
            });
          }}
        >
          <View style={styles.action}>
            <Icon
              of={held?.state === 'here' ? CircleCheck : Download}
              colour={held?.state === 'here' ? colours.accent : colours.text}
            />
            <Words size="small">
              {held === null
                ? preparing === null
                  ? say('common.download')
                  : preparing.secondsLeft === null
                    ? say('phone.aTitle.preparingPercent', {
                        percent: Math.round(preparing.progress * 100).toString(),
                      })
                    : say('phone.aTitle.preparingPercentTimeLeft', {
                        percent: Math.round(preparing.progress * 100).toString(),
                        timeLeft: describeTimeToGo(preparing.secondsLeft),
                      })
                : held.state === 'here'
                  ? say('common.downloaded')
                  : held.ofBytes === null || held.ofBytes === 0
                    ? say('common.downloading')
                    : `${Math.round((held.bytes / held.ofBytes) * 100).toString()}%`}
            </Words>
          </View>
        </Button>

        <Button
          tone="bare"
          label={say('common.share')}
          onPress={() => {
            setSharing({
              kind: 'item',
              media: {
                id: title.id,
                title: title.title,
                seriesId: programme?.seriesId ?? null,
                seriesTitle,
              },
            });
          }}
        >
          <View style={styles.action}>
            <Icon of={Share} colour={colours.text} />
            <Words size="small">{say('common.share')}</Words>
          </View>
        </Button>

        <Button
          tone="bare"
          label={say('common.more')}
          onPress={() => {
            askAboutATitle(title.title, [
              {
                label: isWatched
                  ? say('common.markTitleAsUnwatched', { title: title.title })
                  : say('common.markTitleAsWatched', { title: title.title }),
                onChoose: () => {
                  void markWatched([title], !isWatched)
                    .then(async () =>
                      Promise.all([
                        cache.invalidateQueries({ queryKey: viewingQueries.progress().queryKey }),
                        cache.invalidateQueries({ queryKey: libraryQueries.key }),
                      ]),
                    )
                    .catch(() => null);
                },
              },
              ...(onStartParty === undefined
                ? []
                : [
                    {
                      label: say('screens.mediaDetailDialog.watchTogether'),
                      onChoose: () => {
                        onStartParty(playing, carryOnAt ?? 0);
                      },
                    },
                  ]),
              ...(hasTelevision
                ? [
                    {
                      label: say('common.playOnTV'),
                      onChoose: () => {
                        setIsPlayingOn(true);
                      },
                    },
                  ]
                : []),
              {
                label: say('common.hide'),
                onChoose: () => {
                  hiding.ask({ id: title.id, title: title.title, seriesId: null, seriesTitle });
                },
              },
            ]);
          }}
        >
          <View style={styles.action}>
            <Icon of={MoreHorizontal} colour={colours.text} />
            <Words size="small">{say('common.more')}</Words>
          </View>
        </Button>
      </View>

      <AShareSheet
        subject={sharing}
        onClose={() => {
          setSharing(null);
        }}
      />

      <APlayOnSheet
        media={isPlayingOn ? { id: playing, title: title.title } : null}
        startSeconds={carryOnAt ?? 0}
        onClose={() => {
          setIsPlayingOn(false);
        }}
      />

      <TheStars subject={{ mediaId }} />

      {details.length === 0 ? null : (
        <View style={styles.details}>
          {details.map((detail) => (
            <View key={detail.label} style={styles.detail}>
              <Words size="small" tone="muted">
                {detail.label}
              </Words>
              <View style={styles.detailValue}>
                {detail.tomato === undefined ? null : <ATomatoMark score={detail.tomato} />}
                <Words>{detail.value}</Words>
              </View>
            </View>
          ))}
        </View>
      )}

      <TheCast cast={metadata.cast ?? []} onLookAtPerson={onLookAtPerson} />

      <APluginPanels on="title" subjectId={mediaId} />

      {extras.length === 0 ? null : (
        <AShelf title={say('common.extras')}>
          {extras.map((extra) => (
            <Button
              key={extra.id}
              tone="bare"
              label={extra.title}
              onPress={() => {
                onWatch(extra.id, 0);
              }}
            >
              <APoster
                title={extra.title}
                artwork={
                  extra.hasPoster ? onThisServer(`/api/media/${extra.id}/image/poster`) : null
                }
                note={
                  extra.extraKind === null || extra.extraKind === undefined
                    ? null
                    : EXTRA_KIND_LABELS[extra.extraKind]
                }
              />
            </Button>
          ))}
        </AShelf>
      )}
    </Screen>
  );
};

ATitle.displayName = 'ATitle';

export { ATitle };
