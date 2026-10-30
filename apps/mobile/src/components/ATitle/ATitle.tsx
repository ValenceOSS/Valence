import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import {
  ChevronsUpDown,
  CircleCheck,
  Download,
  Heart,
  MoreHorizontal,
  Share,
  Tv,
} from '@keyline-icons/react-native';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';
import { APlayOnSheet } from '@ValenceMobile/components/APlayOnSheet/APlayOnSheet';
import {
  CircleCheck as CircleCheckFilled,
  Heart as HeartFilled,
  ListVideo as ListVideoFilled,
} from '@keyline-icons/react-native/fill';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { markWatchedInPlace } from '@ValenceClient/playback/markWatchedInPlace';
import { AMenu } from '@ValenceMobile/components/AMenu/AMenu';
import { qualityBadges } from '@ValenceClient/library/qualityBadges';
import { theVersionsOf } from '@ValenceClient/library/theVersionsOf';
import { describeTitleDetails } from '@ValenceClient/library/describeTitleDetails';
import { AnOverview } from '@ValenceMobile/components/AnOverview/AnOverview';
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
import { ADetailRow } from '@ValenceMobile/components/ADetailRow/ADetailRow';
import { AGlassCircle } from '@ValenceMobile/components/AGlassCircle/AGlassCircle';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { AWideButton } from '@ValenceMobile/components/AWideButton/AWideButton';
import { APlayButton } from '@ValenceMobile/components/APlayButton/APlayButton';
import { ARising } from '@ValenceMobile/components/ARising/ARising';
import { ARoundAction } from '@ValenceMobile/components/ARoundAction/ARoundAction';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { APluginPanels } from '@ValenceMobile/components/APluginPanels/APluginPanels';
import { TheBadges } from '@ValenceMobile/components/TheBadges/TheBadges';
import { TheCast } from '@ValenceMobile/components/TheCast/TheCast';
import { TheStars } from '@ValenceMobile/components/TheStars/TheStars';
import { Words } from '@ValenceMobile/components/Words/Words';
import { AShareSheet } from '@ValenceMobile/components/AShareSheet/AShareSheet';
import { howLongItRuns } from '@ValenceMobile/components/ATitle/howLongItRuns';
import { useConfirmHiding } from '@ValenceNative/library/useConfirmHiding';
import { askToKeepOnThisPhone } from '@ValenceMobile/downloads/askToKeepOnThisPhone';
import { useTheProgrammeOfEpisode } from '@ValenceClient/library/useTheProgrammeOfEpisode';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { useArtworkTint } from '@ValenceMobile/hooks/useArtworkTint';
import { GROUND } from '@ValenceMobile/theme/GROUND';
import { ACardPart } from '@ValenceMobile/components/ACardPart/ACardPart';
import { AHairline } from '@ValenceMobile/components/AHairline/AHairline';
import { ATintedGround } from '@ValenceMobile/components/ATintedGround/ATintedGround';
import { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import { whereFrom } from '@ValenceClient/linking/whereFrom';
import { usePreferredCopy } from '@ValenceClient/linking/usePreferredCopy';
import type { ShareSubject } from '@ValenceClient/sharing/newShareFor.types';
import type { ATitleProps } from './ATitle.types';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { say } from '@ValenceI18n/say';
import { ALikeThisShelf } from '@ValenceMobile/components/ALikeThisShelf/ALikeThisShelf';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { ABadgeRow } from '@ValenceMobile/components/ABadgeRow/ABadgeRow';
import { AnAddToCollectionSheet } from '@ValenceMobile/components/AnAddToCollectionSheet/AnAddToCollectionSheet';
import { subjectOfMedia } from '@ValenceClient/collections/subjectOfMedia';
import type { CollectionSubject } from '@ValenceContracts/schemas/Collection';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const styles = StyleSheet.create({
  about: { gap: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-evenly' },
  details: { gap: 12 },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  headline: { alignItems: 'center', gap: 12 },
  playing: { gap: 10 },
});

/**
 * Everything about one film or episode, as the web's page about it: its artwork, what it is, a way
 * to watch it — from the start, from where somebody stopped, or in another version — and the rest:
 * favouriting it, downloading it to the phone, rating it, its trailer, hiding it, who is in it, the
 * details the catalogue knows and whatever extras came with it.
 *
 * On a dark page it is tinted with the colour of its artwork, which the artwork fades into and
 * which deepens to the page's own colour towards the foot.
 *
 * An episode offers its programme, found in its library by name, since that is what an episode
 * knows of it.
 *
 * @param mediaId - Which title.
 * @param onWatch - Told to play something, and from where.
 * @param onLookAt - Told to open a film like this one.
 * @param onLookAtPerson - Told whose page to open.
 * @param onLookAtShow - Told to open a programme.
 * @param onBack - Told somebody is done with it.
 * @param onToTheRemote - Told it was sent to a television, to bring up that television's remote.
 * @param onStartParty - Told to start a watch party on what is about to play, where this phone can.
 */
const ATitle = ({
  mediaId,
  onWatch,
  onLookAt,
  onLookAtPerson,
  onLookAtShow,
  onBack,
  onToTheRemote,
  onStartParty,
}: ATitleProps) => {
  const asking = useQuery(libraryQueries.detail(mediaId));
  const watched = useQuery(viewingQueries.progress());
  const colours = useTheColours();
  const tint = useArtworkTint(asking.data?.metadata.hasBackdrop === true ? mediaId : null);
  const mayShare = useWhatIMayDo().may('sharing.link');
  const watching = useWatchingProfile();
  const favourites = useFavourites(watching);
  const hiding = useHidden(watching);
  const cache = useQueryClient();
  const held = useHeldFiles().find((file) => file.mediaId === mediaId) ?? null;
  const [sharing, setSharing] = useState<ShareSubject | null>(null);
  const [collecting, setCollecting] = useState<CollectionSubject | null>(null);
  const [isPlayingOn, setIsPlayingOn] = useState(false);
  const hasTelevision = useVideoDevices().some((device) => device.kind === 'tv');
  const preparing =
    useQuery(downloadQueries.all()).data?.find(
      (download) => download.mediaId === mediaId && download.state === 'preparing',
    ) ?? null;
  const [version, setVersion] = useState<string | null>(null);
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
        <ASpinner colour={colours.textMuted} />
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
    metadata.rating === null || metadata.rating === undefined || metadata.rating <= 0
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

  const runs = title.durationSeconds;
  const more = [
    ...(trailer === null && trailerKey === null
      ? []
      : [
          {
            id: 'trailer',
            label: say('common.trailer'),
            symbol: 'play.rectangle' as const,
            onChoose: () => {
              if (trailer !== null) {
                onWatch(trailer.id, 0);

                return;
              }

              if (trailerKey !== null) {
                void Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`);
              }
            },
          },
        ]),
    ...(onStartParty === undefined
      ? []
      : [
          {
            id: 'together',
            label: say('screens.mediaDetailDialog.watchTogether'),
            symbol: 'person.2' as const,
            onChoose: () => {
              onStartParty(playing, carryOnAt ?? 0);
            },
          },
        ]),
    {
      id: 'collection',
      label: say('common.addToACollection'),
      symbol: 'rectangle.stack.badge.plus' as const,
      onChoose: () => {
        setCollecting(subjectOfMedia({ id: title.id, seriesId: programme?.seriesId ?? null }));
      },
    },
    {
      id: 'hide',
      label: say('common.hide'),
      symbol: 'eye.slash' as const,
      startsAGroup: true,
      onChoose: () => {
        hiding.ask({ id: title.id, title: title.title, seriesId: null, seriesTitle });
      },
    },
  ];

  return (
    <GROUND.Provider value={tint}>
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
            {...(tint === null ? {} : { ground: tint })}
          />
        }
        {...(tint === null
          ? {}
          : {
              behind: <ATintedGround tint={tint} />,
            })}
        {...(hasTelevision
          ? {
              corner: (
                <AGlassCircle
                  of={Tv}
                  label={say('common.playOnTV')}
                  onPress={() => {
                    setIsPlayingOn(true);
                  }}
                />
              ),
            }
          : {})}
      >
        <ARising>
          <View style={styles.headline}>
            {seriesTitle === null ? null : (
              <Words size="heading" isCentred>
                {title.title}
              </Words>
            )}

            <Words size="lead" tone="muted" isCentred>
              {facts.join(' · ')}
            </Words>

            <View style={styles.badges}>
              <TheBadges
                isLarge
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
            </View>

            {origin === null ? null : (
              <Words size="small" tone={origin.isReachable ? 'muted' : 'danger'} isCentred>
                {whereFrom(origin)}
              </Words>
            )}
          </View>
        </ARising>

        <ARising turn={1}>
          <View style={styles.playing}>
            <APlayButton
              says={
                carryOnAt === null
                  ? say('common.play')
                  : say('phone.aTitle.resumeFromCarryOnAt', { carryOnAt: howLongItRuns(carryOnAt) })
              }
              watched={carryOnAt === null || runs === 0 ? null : carryOnAt / runs}
              onPress={() => {
                onWatch(playing, carryOnAt ?? 0);
              }}
              {...(carryOnAt === null
                ? {}
                : {
                    onStartAgain: () => {
                      onWatch(playing, 0);
                    },
                  })}
            />

            {programme === null ? null : (
              <AWideButton
                icon={ListVideoFilled}
                says={say('phone.aTitle.allEpisodes')}
                label={say('phone.aTitle.allEpisodesOfTitle', { title: programme.title })}
                onPress={() => {
                  onLookAtShow(programme.libraryId, programme.id);
                }}
              />
            )}
          </View>
        </ARising>

        <ARising turn={2}>
          <View style={styles.actions}>
            <ARoundAction
              icon={isKept ? HeartFilled : Heart}
              ink={isKept ? colours.danger : colours.text}
              says={say('phone.aTitle.favourite')}
              isChosen={isKept}
              onPress={() => {
                favourites.toggle(mediaId);
              }}
            />

            <ARoundAction
              icon={isWatched ? CircleCheckFilled : CircleCheck}
              says={say('common.watched')}
              isChosen={isWatched}
              onPress={() => {
                void markWatchedInPlace(cache, [title], !isWatched).catch(() => null);
              }}
            />

            <ARoundAction
              icon={held?.state === 'here' ? CircleCheckFilled : Download}
              says={
                held === null
                  ? preparing === null
                    ? say('common.download')
                    : say('phone.aTitle.preparingPercent', {
                        percent: Math.round(preparing.progress * 100).toString(),
                      })
                  : held.state === 'here'
                    ? say('common.downloaded')
                    : held.ofBytes === null || held.ofBytes === 0
                      ? say('common.downloading')
                      : `${Math.round((held.bytes / held.ofBytes) * 100).toString()}%`
              }
              isDisabled={held !== null || preparing !== null}
              onPress={() => {
                void askToKeepOnThisPhone(mediaId, title.title).then(async (isAsked) => {
                  if (isAsked) {
                    await cache.invalidateQueries({ queryKey: downloadQueries.all().queryKey });
                  }
                });
              }}
            />

            {mayShare ? (
              <ARoundAction
                icon={Share}
                says={say('common.share')}
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
              />
            ) : null}

            <AMenu label={say('common.more')} title={title.title} items={more}>
              <ARoundAction icon={MoreHorizontal} says={say('common.more')} />
            </AMenu>
          </View>
        </ARising>

        <AHairline />

        {tagline === null && overview === null && genres.length === 0 ? null : (
          <ARising turn={3}>
            <View style={styles.about}>
              {tagline === null ? null : (
                <Words size="lead" isProse>
                  {tagline}
                </Words>
              )}
              {overview === null ? null : <AnOverview>{overview}</AnOverview>}
              <ABadgeRow badges={genres} isLarge />
            </View>
          </ARising>
        )}

        <AnAddToCollectionSheet
          subject={collecting}
          title={title.title}
          onClose={() => {
            setCollecting(null);
          }}
        />

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
          onSent={onToTheRemote}
        />

        <ACardPart>
          <TheStars subject={{ mediaId }} />
        </ACardPart>

        {details.length === 0 && versions.length === 0 ? null : (
          <ACardPart>
            <View style={styles.details}>
              <Words size="heading">{say('common.details')}</Words>
              <AGroup>
                {versions.length === 0 ? null : (
                  <AMenu
                    label={say('common.whichVersionToPlay')}
                    title={say('common.whichVersionToPlay')}
                    items={offered.map((one) => ({
                      id: one.id,
                      label: one.label,
                      isChosen: one.id === playing,
                      onChoose: () => {
                        setVersion(one.id);
                      },
                    }))}
                  >
                    <ADetailRow
                      label={say('phone.aTitle.version')}
                      value={
                        offered.find((one) => one.id === playing)?.label ?? say('common.original')
                      }
                      icon={ChevronsUpDown}
                    />
                  </AMenu>
                )}
                {details.map((detail) => (
                  <ADetailRow
                    key={detail.label}
                    label={detail.label}
                    value={detail.value}
                    {...(detail.tomato === undefined
                      ? {}
                      : { before: <ATomatoMark score={detail.tomato} /> })}
                  />
                ))}
              </AGroup>
            </View>
          </ACardPart>
        )}

        {(metadata.cast ?? []).length === 0 ? null : (
          <ACardPart>
            <TheCast cast={metadata.cast ?? []} onLookAtPerson={onLookAtPerson} />
          </ACardPart>
        )}

        <APluginPanels on="title" subjectId={mediaId} />

        {extras.length === 0 ? null : (
          <ACardPart>
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
                      extra.hasPoster
                        ? onThisServer(artworkUrl(extra.id, 'poster', { size: 'small' }))
                        : null
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
          </ACardPart>
        )}

        {seriesTitle !== null || (title.extraKind ?? null) !== null ? null : (
          <ACardPart>
            <ALikeThisShelf mediaId={mediaId} onLookAt={onLookAt} onLookAtShow={onLookAtShow} />
          </ACardPart>
        )}
      </Screen>
    </GROUND.Provider>
  );
};

ATitle.displayName = 'ATitle';

export { ATitle };
