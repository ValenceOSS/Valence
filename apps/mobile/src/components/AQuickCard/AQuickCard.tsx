import { StyleSheet, View } from 'react-native';
import { AMusicArt } from '@ValenceMobile/components/AMusicArt/AMusicArt';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { AQuickCardProps } from './AQuickCard.types';

const HIGH = 56;

const ROUND = 12;

const styles = StyleSheet.create({
  art: {
    alignItems: 'center',
    height: HIGH,
    justifyContent: 'center',
    overflow: 'hidden',
    width: HIGH,
  },
  card: {
    alignItems: 'center',
    borderRadius: ROUND,
    flexDirection: 'row',
    gap: 10,
    height: HIGH,
    overflow: 'hidden',
    paddingRight: 10,
  },
  said: { flex: 1 },
});

/**
 * Something in the music library to go straight back to, as a short card: its picture down the
 * leading edge and its name beside it, laid two to a row at the top of the music home so the few
 * things played most are a press away.
 *
 * @param title - What it is called.
 * @param artwork - Its picture, where it has one.
 * @param albumIds - The albums whose covers stand in for it, where it is a collection of songs.
 * @param isRound - Whether its picture is round, as an artist's is.
 * @param standIn - The icon drawn where there is no picture.
 * @param onPress - Told it was pressed.
 * @param onLongPress - Told it was held, for what else can be done with it.
 */
const AQuickCard = ({
  title,
  artwork,
  albumIds,
  isRound = false,
  standIn,
  onPress,
  onLongPress,
}: AQuickCardProps) => {
  const colours = useTheColours();

  return (
    <Button
      tone="bare"
      label={title}
      onPress={onPress}
      {...(onLongPress === undefined ? {} : { onLongPress })}
    >
      <View style={[styles.card, { backgroundColor: withAlpha(colours.text, 0.08) }]}>
        <View
          style={[
            styles.art,
            {
              backgroundColor: colours.surfaceRaised,
              ...(isRound ? { borderRadius: HIGH / 2, transform: [{ scale: 0.86 }] } : {}),
            },
          ]}
        >
          <AMusicArt
            artwork={artwork}
            {...(albumIds === undefined ? {} : { albumIds })}
            standIn={standIn}
            iconSize={22}
          />
        </View>
        <View style={styles.said}>
          <Words size="small" isStrong lines={2}>
            {title}
          </Words>
        </View>
      </View>
    </Button>
  );
};

AQuickCard.displayName = 'AQuickCard';

export { AQuickCard };
