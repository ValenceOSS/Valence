import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import {
  CircleCheck,
  Download,
  EyeOff,
  Film,
  Heart,
  Play,
  RotateCcw,
  Tv,
} from 'lucide-react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { qualityBadges } from '@ValenceClient/library/qualityBadges';
import { describeTitleDetails } from '@ValenceClient/library/describeTitleDetails';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useHidden } from '@ValenceClient/library/useHidden';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { EXTRA_KIND_LABELS } from '@ValenceContracts/schemas/Library';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { AShelf } from '@ValencePhone/components/AShelf/AShelf';
import { ATitleHead } from '@ValencePhone/components/ATitleHead/ATitleHead';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { TheBadges } from '@ValencePhone/components/TheBadges/TheBadges';
import { TheCast } from '@ValencePhone/components/TheCast/TheCast';
import { TheStars } from '@ValencePhone/components/TheStars/TheStars';
import { Words } from '@ValencePhone/components/Words/Words';
import { howLongItRuns } from '@ValencePhone/components/ATitle/howLongItRuns';
import { useConfirmHiding } from '@ValencePhone/hooks/useConfirmHiding';
import { askToKeepOnThisPhone } from '@ValencePhone/downloads/askToKeepOnThisPhone';
import { useTheProgrammeOfEpisode } from '@ValencePhone/hooks/useTheProgrammeOfEpisode';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { ATitleProps } from './ATitle.types';

const styles = StyleSheet.create({
  action: { alignItems: 'center', gap: 4, minWidth: 76 },
  actions: {
    columnGap: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 16,
  },
  detail: { gap: 2, width: '47%' },
  details: { columnGap: 12, flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
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
  const preparing =
    useQuery(downloadQueries.all()).data?.find(
      (download) => download.mediaId === mediaId && download.state === 'preparing',
    ) ?? null;
  const [version, setVersion] = useState<string | null>(null);
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
            : ` E${metadata.episodeNumber.toString()}`
        }`,
    title.year === null || title.year === undefined ? null : title.year.toString(),
    howLongItRuns(title.durationSeconds),
    metadata.rating === null || metadata.rating === undefined
      ? null
      : `★ ${metadata.rating.toFixed(1)}`,
  ].filter((fact) => fact !== null);
  const details = describeTitleDetails(metadata);

  return (
    <Screen
      scrolls
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
      {seriesTitle === null ? null : <Words tone="muted">{seriesTitle}</Words>}

      <Words tone="muted">{facts.join(' · ')}</Words>

      <TheBadges badges={qualityBadges(title)} />

      {(metadata.genres ?? []).length === 0 ? null : (
        <Words size="small" tone="muted">
          {(metadata.genres ?? []).join(', ')}
        </Words>
      )}

      {versions.length > 1 ? (
        <SegmentedRow
          label="Version"
          items={versions.map((one) => ({ id: one.id, label: one.versionLabel ?? one.title }))}
          value={playing}
          onSelect={setVersion}
        />
      ) : null}

      <Button
        tone="bold"
        icon={Play}
        onPress={() => {
          onWatch(playing, carryOnAt ?? 0);
        }}
      >
        {carryOnAt === null ? 'Play' : `Resume from ${howLongItRuns(carryOnAt)}`}
      </Button>

      <View style={styles.actions}>
        <Button
          tone="bare"
          label="Favourite"
          isChosen={isKept}
          onPress={() => {
            favourites.toggle(mediaId);
          }}
        >
          <View style={styles.action}>
            <Icon of={Heart} colour={isKept ? colours.danger : colours.text} isFilled={isKept} />
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

        {carryOnAt === null ? null : (
          <Button
            tone="bare"
            label="Start again"
            onPress={() => {
              onWatch(playing, 0);
            }}
          >
            <View style={styles.action}>
              <Icon of={RotateCcw} colour={colours.text} />
              <Words size="small">Start again</Words>
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

        {programme === null ? null : (
          <Button
            tone="bare"
            label={`Open ${programme.title}`}
            onPress={() => {
              onLookAtShow(programme.libraryId, programme.id);
            }}
          >
            <View style={styles.action}>
              <Icon of={Tv} colour={colours.text} />
              <Words size="small">Programme</Words>
            </View>
          </Button>
        )}
      </View>

      <TheStars subject={{ mediaId }} />

      {metadata.tagline === null || metadata.tagline === undefined ? null : (
        <Words isProse>{metadata.tagline}</Words>
      )}

      {metadata.overview === null || metadata.overview === undefined ? null : (
        <Words tone="muted">{metadata.overview}</Words>
      )}

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
