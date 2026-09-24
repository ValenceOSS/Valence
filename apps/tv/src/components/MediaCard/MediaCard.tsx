import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { titleLogoUrl } from '@ValenceClient/library/titleLogoUrl';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { ProgressLine } from '@ValenceTv/components/ProgressLine/ProgressLine';
import { tokens } from '@ValenceTv/theme/tokens';
import { cardSizes } from './cardSizes';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MediaCardProps, MediaCardShape } from './MediaCard.types';

/**
 * Which of a title's pictures suits a card of this shape, falling back to the other where it has
 * only one.
 *
 * @param media - The title.
 * @param shape - The card's shape.
 * @returns Where the picture is served, or nothing where it has neither.
 */
const pictureFor = (media: MediaSummary, shape: MediaCardShape): string | null => {
  const [first, second] =
    shape === 'wide' ? (['backdrop', 'poster'] as const) : (['poster', 'backdrop'] as const);
  const has = { backdrop: media.hasBackdrop, poster: media.hasPoster };

  if (has[first]) {
    return artworkUrl(media.id, first);
  }

  return has[second] ? artworkUrl(media.id, second) : null;
};

/**
 * Where an episode falls in its programme, as a card says it beneath the programme's name.
 *
 * @param media - The episode.
 * @returns Its season and number, and its own title.
 */
const whereItFalls = (media: MediaSummary): string => {
  const numbers =
    typeof media.seasonNumber === 'number' && typeof media.episodeNumber === 'number'
      ? `S${media.seasonNumber.toString()} · E${media.episodeNumber.toString()}  `
      : '';

  return `${numbers}${media.title}`;
};

/**
 * One title on a shelf or in a grid: its picture with rounded corners and, on a wide card, its logo
 * lettered across the foot of it, lifted on a shadow when the remote is on it, with a line for how
 * far through it this viewer is. A title with no logo is named beneath while the remote is on it.
 *
 * A card standing for a programme is named for the programme rather than the episode it happens to
 * be, and an episode somebody is part-way through says which one it is.
 *
 * Only the name beneath changes as the remote lands on it and leaves, so the picture is built once
 * and handed back unchanged each time, and landing on a card never draws its pictures again.
 *
 * @param media - The title.
 * @param onPress - Told when it is chosen.
 * @param shape - Wide for backdrops, tall for posters.
 * @param watchedFraction - How far through it this viewer is, where they have started it.
 * @param unwatchedCount - For a programme, how many of its episodes are left to watch.
 * @param isEpisode - Whether it stands for the episode itself rather than its programme.
 * @param hasPreferredFocus - Whether the remote starts here.
 * @param isUrgent - Whether its pictures are fetched ahead of others, as the first shelf's are.
 * @param width - How wide it is, where it is sized to fill a grid rather than drawn at its shape's own
 *   size; it keeps its shape's proportions.
 * @param onFocus - Told when the remote lands on it.
 */
const MediaCard = ({
  media,
  onPress,
  shape = 'wide',
  watchedFraction,
  unwatchedCount,
  isEpisode = false,
  hasPreferredFocus = false,
  isUrgent = false,
  width,
  onFocus,
}: MediaCardProps) => {
  const size = useMemo(() => {
    const natural = cardSizes[shape];

    return width === undefined
      ? natural
      : { width, height: Math.round((width * natural.height) / natural.width) };
  }, [shape, width]);
  const name = media.seriesTitle ?? media.title;
  const [hasNoLogo, setHasNoLogo] = useState(false);
  const isLettered = shape === 'wide' && media.hasLogo && !hasNoLogo;

  const picture = useMemo(
    () => (
      <View style={[styles.picture, size]}>
        <Artwork
          path={pictureFor(media, shape)}
          isUrgent={isUrgent}
          style={StyleSheet.absoluteFill}
        />

        {isLettered ? (
          <>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
              start={{ x: 0.5, y: 0.45 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Artwork
              path={titleLogoUrl(media.id)}
              fit="contain"
              anchor="left"
              isUrgent={isUrgent}
              style={styles.logo}
              onMissing={() => {
                setHasNoLogo(true);
              }}
            />
          </>
        ) : null}

        {watchedFraction === undefined ? null : <ProgressLine fraction={watchedFraction} />}

        {unwatchedCount === undefined || unwatchedCount <= 0 ? null : (
          <View
            style={styles.count}
            accessible
            accessibilityLabel={`${unwatchedCount.toString()} ${unwatchedCount === 1 ? 'episode' : 'episodes'} left`}
          >
            <Text style={styles.countWords}>
              {unwatchedCount > 99 ? '99+' : unwatchedCount.toString()}
            </Text>
          </View>
        )}
      </View>
    ),
    [media, shape, size, isLettered, isUrgent, watchedFraction, unwatchedCount],
  );

  return (
    <Focusable
      label={name}
      shadow={{ height: size.height, cornerRadius: tokens.radii.xl }}
      hasPreferredFocus={hasPreferredFocus}
      scale={1.1}
      onPress={() => {
        onPress(media);
      }}
      onFocus={() => {
        onFocus?.(media);
      }}
    >
      {(isFocused) => (
        <View style={{ width: size.width }}>
          {picture}

          <Text
            numberOfLines={1}
            style={[
              styles.name,
              ((!isFocused && !isEpisode) || (isLettered && !isEpisode)) && styles.hidden,
            ]}
          >
            {name}
          </Text>

          {isEpisode && typeof media.seriesTitle === 'string' ? (
            <Text numberOfLines={1} style={styles.detail}>
              {whereItFalls(media)}
            </Text>
          ) : null}
        </View>
      )}
    </Focusable>
  );
};

MediaCard.displayName = 'MediaCard';

const styles = StyleSheet.create({
  count: {
    position: 'absolute',
    top: tokens.space.sm,
    right: tokens.space.sm,
    minWidth: 36,
    height: 36,
    paddingHorizontal: tokens.space.sm,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colours.text,
  },
  countWords: {
    color: tokens.colours.onWhite,
    fontSize: tokens.type.small,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  picture: {
    borderRadius: tokens.radii.xl,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
  },
  name: {
    marginTop: tokens.space.md,
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    fontWeight: '600',
  },
  logo: {
    position: 'absolute',
    left: tokens.space.md,
    bottom: tokens.space.md,
    width: '55%',
    height: '34%',
    backgroundColor: 'transparent',
  },
  hidden: { opacity: 0 },
  detail: { color: tokens.colours.muted, fontSize: tokens.type.small - 2 },
});

export { MediaCard };
