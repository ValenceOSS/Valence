import { Shuffle } from '@keyline-icons/react-native';
import { Play as PlayFilled } from '@keyline-icons/react-native/fill';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { AMusicHeadProps } from './AMusicHead.types';

const SIDE = 220;

const styles = StyleSheet.create({
  art: {
    alignItems: 'center',
    height: SIDE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: SIDE,
  },
  buttons: { alignSelf: 'stretch', flexDirection: 'row', gap: 10 },
  fills: { height: '100%', width: '100%' },
  half: { flex: 1 },
  said: { alignItems: 'center', gap: 4 },
  whole: { alignItems: 'center', gap: 16 },
});

/**
 * The head of an album's, an artist's, a playlist's or liked songs' page, as the web draws it: the
 * cover, what kind of thing it is, what it is called and a line about it, and a way to play it in
 * order or shuffled.
 *
 * @param kind - What kind of thing it is, said small above its name.
 * @param title - What it is called.
 * @param detail - A line about it, where there is one.
 * @param artwork - Its cover, or nothing where it has none.
 * @param standIn - What is drawn where there is no cover.
 * @param isRound - Whether the cover is round, as an artist's is.
 * @param canPlay - Whether there is anything to play.
 * @param onPlay - Told to play it from the start.
 * @param onShuffle - Told to play it shuffled.
 * @param children - Anything more said beneath it, before the buttons.
 */
const AMusicHead = ({
  kind,
  title,
  detail,
  artwork,
  standIn,
  isRound = false,
  canPlay,
  onPlay,
  onShuffle,
  children,
}: AMusicHeadProps) => {
  const colours = useTheColours();
  const [isMissing, setIsMissing] = useState(false);

  return (
    <View style={styles.whole}>
      <View
        style={[
          styles.art,
          { backgroundColor: colours.surfaceRaised, borderRadius: isRound ? SIDE / 2 : 16 },
        ]}
      >
        {artwork === null || isMissing ? (
          <Icon of={standIn} size={64} colour={colours.textMuted} />
        ) : (
          <Image
            style={styles.fills}
            source={{ uri: artwork }}
            accessibilityIgnoresInvertColors
            onError={() => {
              setIsMissing(true);
            }}
          />
        )}
      </View>

      <View style={styles.said}>
        <Words size="small" tone="muted">
          {kind}
        </Words>
        <Words size="title" isCentred>
          {title}
        </Words>
        {detail === null ? null : (
          <Words tone="muted" isCentred>
            {detail}
          </Words>
        )}
        {children}
      </View>

      {canPlay ? (
        <View style={styles.buttons}>
          <View style={styles.half}>
            <Button tone="bold" icon={PlayFilled} onPress={onPlay}>
              Play
            </Button>
          </View>
          <View style={styles.half}>
            <Button tone="ghost" icon={Shuffle} isWide onPress={onShuffle}>
              Shuffle
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
};

AMusicHead.displayName = 'AMusicHead';

export { AMusicHead };
