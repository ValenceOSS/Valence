import { useProgress } from '@ValenceTv/library/useProgress';
import { isTitleWatched } from '@ValenceClient/requests/isTitleWatched';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { nameTheStanding } from '@ValenceClient/requests/nameTheStanding';
import { Check } from '@keyline-icons/react-native';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { cardSizes } from '@ValenceTv/components/MediaCard/cardSizes';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CatalogueCardProps } from './CatalogueCard.types';

/**
 * A film or show from the film database rather than the library: its poster, named beneath while
 * the remote is on it, with where it stands — in the library already, asked for, on its way —
 * written under it, so a wall of them says at a glance which are still to be asked for. A tick in the
 * corner means watched, as it does everywhere else — a film this profile has seen to the end.
 *
 * @param title - The film or show.
 * @param onPress - Told when it is chosen.
 * @param width - How wide it is, where it is sized to fill a grid; it keeps a poster's proportions.
 */
const CatalogueCard = ({ title, onPress, width }: CatalogueCardProps) => {
  const size = useMemo(() => {
    const natural = cardSizes.poster;

    return width === undefined
      ? natural
      : { width, height: Math.round((width * natural.height) / natural.width) };
  }, [width]);
  const standing = nameTheStanding(title.standing);
  const { progress } = useProgress();
  const isWatched = isTitleWatched(title, progress);

  const poster = useMemo(
    () => (
      <View style={[styles.poster, size]}>
        <Artwork path={title.posterUrl} style={StyleSheet.absoluteFill} />

        {isWatched ? (
          <View style={styles.had} accessible accessibilityLabel="Watched">
            <Icon of={Check} size={26} colour={tokens.colours.onWhite} />
          </View>
        ) : null}
      </View>
    ),
    [title.posterUrl, size, isWatched],
  );

  return (
    <Focusable
      label={[title.title, standing?.label ?? null, isWatched ? 'watched' : null]
        .filter((part) => part !== null)
        .join(', ')}
      shadow={{ height: size.height, cornerRadius: tokens.radii.xl }}
      scale={1.1}
      onPress={() => {
        onPress(title);
      }}
    >
      {(isFocused) => (
        <View style={{ width: size.width }}>
          {poster}

          <Text numberOfLines={1} style={[styles.name, !isFocused && styles.hidden]}>
            {title.title}
          </Text>

          {standing === null ? null : (
            <Text numberOfLines={1} style={styles.standing}>
              {standing.label}
            </Text>
          )}
        </View>
      )}
    </Focusable>
  );
};

CatalogueCard.displayName = 'CatalogueCard';

const styles = StyleSheet.create({
  poster: {
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
  hidden: { opacity: 0 },
  had: {
    position: 'absolute',
    top: tokens.space.sm,
    right: tokens.space.sm,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  standing: { color: tokens.colours.muted, fontSize: tokens.type.small - 2 },
});

export { CatalogueCard };
