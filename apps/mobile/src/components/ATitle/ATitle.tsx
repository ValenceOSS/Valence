import {
  ChevronsUpDown,
  CircleCheck,
  Download,
  EyeOff,
  Film,
  Heart,
  ListVideo,
  RotateCcw,
  Share,
} from '@keyline-icons/react-native';
import { Heart as HeartFilled, Play as PlayFilled } from '@keyline-icons/react-native/fill';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { qualityBadges } from '@ValenceClient/library/qualityBadges';
import { theVersionsOf } from '@ValenceClient/library/theVersionsOf';
import { describeTitleDetails } from '@ValenceClient/library/describeTitleDetails';
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
import { TheBadges } from '@ValenceMobile/components/TheBadges/TheBadges';
import { TheCast } from '@ValenceMobile/components/TheCast/TheCast';
import { TheStars } from '@ValenceMobile/components/TheStars/TheStars';
import { Words } from '@ValenceMobile/components/Words/Words';
import { AShareSheet } from '@ValenceMobile/components/AShareSheet/AShareSheet';
import { howLongItRuns } from '@ValenceMobile/components/ATitle/howLongItRuns';
import { askWhichVersion } from '@ValenceMobile/components/ATitle/askWhichVersion';
import { useConfirmHiding } from '@ValenceMobile/hooks/useConfirmHiding';
import { askToKeepOnThisPhone } from '@ValenceMobile/downloads/askToKeepOnThisPhone';
import { useTheProgrammeOfEpisode } from '@ValenceMobile/hooks/useTheProgrammeOfEpisode';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { ShareSubject } from '@ValenceClient/sharing/newShareFor.types';
import type { ATitleProps } from './ATitle.types';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';

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
 */
const ATitle = ({ mediaId, onWatch, onLookAtPerson, onLookAtShow, onBack }: ATitleProps) => {
  const asking = useQuery(libraryQueries.detail(mediaId));
  const watched = useQuery(viewingQueries.progress());
  const colours = useTheColours();
  const watching = useWatchingProfile();
  const favourites = useFavourites(watching);
  const hiding = useHidden(watching);
  const cache = useQueryClient();
  const held = useHeldFiles().find((file) => file.mediaId === mediaId) ?? null;
  const [sharing, setSharing] = useState<ShareSubject | null>(null);
  const preparing =
    useQuery(downloadQueries.all()).data?.find(
      (download) => download.mediaId === mediaId && download.state === 'preparing',
    ) ?? null;
  const [version, setVersion] = useState<string | null>(null);
  const [playHeight, setPlayHeight] = useState(PLAY_HEIGHT);
  const title = asking.data;
  const seriesTitle = title?.metadata.seriesTitle ?? null;
  const programme = useTheProgrammeOfEpisode(mediaId);
  const playing = version ?? mediaId;
  const carryOnAt = resumeFor(byMediaId(watched.data ?? []), playing);

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
        <Words tone="danger">That title could not be read.</Words>
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
    (metadata.genres ?? []).length === 0 ? null : (metadata.genres ?? []).slice(0, 2).join(', '),
  ].filter((fact) => fact !== null);
  const details = describeTitleDetails(metadata);
  const tagline = seriesTitle === null ? (metadata.tagline ?? null) : null;
  const overview = metadata.overview ?? null;
  const offered = theVersionsOf(mediaId, versions);

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

      <View style={styles.facts}>
        <Words tone="muted">{facts.join(' · ')}</Words>
        <TheBadges badges={qualityBadges(title)} />
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
          label="Which version to play"
          onPress={() => {
            askWhichVersion(offered, setVersion);
          }}
        >
          {offered.find((one) => one.id === playing)?.label ?? 'Original'}
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
            {carryOnAt === null ? 'Play' : `Resume from ${howLongItRuns(carryOnAt)}`}
          </Button>
        </View>

        {carryOnAt === null ? null : (
          <Button
            tone="bare"
            label="Start again"
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

      <View style={styles.actions}>
        {programme === null ? null : (
          <Button
            tone="bare"
            label={`All episodes of ${programme.title}`}
            onPress={() => {
              onLookAtShow(programme.libraryId, programme.id);
            }}
          >
            <View style={styles.action}>
              <Icon of={ListVideo} colour={colours.text} />
              <Words size="small">Episodes</Words>
            </View>
          </Button>
        )}

        <Button
          tone="bare"
          label="Favourite"
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
            <Words size="small">Favourite</Words>
          </View>
        </Button>

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
          label={held === null ? 'Download' : held.state === 'here' ? 'Downloaded' : 'Downloading'}
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
                  ? 'Download'
                  : `Preparing ${Math.round(preparing.progress * 100).toString()}%`
                : held.state === 'here'
                  ? 'Downloaded'
                  : held.ofBytes === null || held.ofBytes === 0
                    ? 'Downloading'
                    : `${Math.round((held.bytes / held.ofBytes) * 100).toString()}%`}
            </Words>
          </View>
        </Button>

        <Button
          tone="bare"
          label="Share"
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
            <Words size="small">Share</Words>
          </View>
        </Button>

        <Button
          tone="bare"
          label="Hide"
          onPress={() => {
            hiding.ask({
              id: title.id,
              title: title.title,
              seriesId: null,
              seriesTitle,
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

      <TheStars subject={{ mediaId }} />

      {details.length === 0 ? null : (
        <View style={styles.details}>
          {details.map((detail) => (
            <View key={detail.label} style={styles.detail}>
              <Words size="small" tone="muted">
                {detail.label}
              </Words>
              <Words>{detail.value}</Words>
            </View>
          ))}
        </View>
      )}

      <TheCast cast={metadata.cast ?? []} onLookAtPerson={onLookAtPerson} />

      {extras.length === 0 ? null : (
        <AShelf title="Extras">
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
