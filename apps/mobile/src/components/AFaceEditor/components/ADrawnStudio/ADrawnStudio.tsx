import { useState } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import { Shuffle } from '@keyline-icons/react-native';
import { drawingToShow } from '@ValenceClient/profiles/drawingToShow';
import { useSettledValue } from '@ValenceClient/profiles/useSettledValue';
import { AVATAR_STYLES, PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { AVATAR_STYLE_NAMES } from '@ValenceClient/profiles/AVATAR_STYLE_NAMES';
import { AColourSwatches } from '@ValenceMobile/components/AColourSwatches/AColourSwatches';
import { AFaceChoice } from '@ValenceMobile/components/AFaceEditor/components/AFaceChoice/AFaceChoice';
import { APicture } from '@ValenceMobile/components/APicture/APicture';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import type { ADrawnStudioProps } from './ADrawnStudio.types';
import { say } from '@ValenceI18n/say';

const SPIN_MS = 500;

const SETTLES_AFTER = 250;

const styles = StyleSheet.create({
  face: { height: '100%', width: '100%' },
  row: { paddingVertical: 2 },
  section: { gap: 14 },
});

/**
 * The avatar studio, as the web's: a row that scrolls sideways of a way to draw a face afresh at
 * random, then the styles to draw it in, each shown as the face itself, and beneath it what is
 * behind it: nothing, or a colour. The shuffle spins round once each time it is pressed, so a new
 * face is seen to have been drawn.
 *
 * @param style - The chosen style.
 * @param seed - What the face is drawn from.
 * @param colour - The profile's colour, behind the face where it is drawn on it.
 * @param isOnColour - Whether the face is drawn on that colour, rather than clear.
 * @param onChange - Told the chosen style and seed.
 * @param onColour - Told a colour was chosen to draw the face on.
 * @param onClear - Told the face is to be drawn clear.
 */
const ADrawnStudio = ({
  style,
  seed,
  colour,
  isOnColour,
  onChange,
  onColour,
  onClear,
}: ADrawnStudioProps) => {
  const colours = useTheColours();
  const isStill = usePrefersStillness();
  const settledColour = useSettledValue(colour, SETTLES_AFTER);
  const [turns] = useState(() => new Animated.Value(0));
  const [count, setCount] = useState(0);

  const randomise = () => {
    const next = count + 1;

    setCount(next);
    onChange({ style, seed: Math.random().toString(36).slice(2, 12) });

    if (isStill) {
      turns.setValue(next);

      return;
    }

    Animated.timing(turns, {
      toValue: next,
      duration: SPIN_MS,
      easing: EASINGS.outCubic,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.section}>
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <AFaceChoice
          label={say('screens.faceEditor.drawnStudio.randomise')}
          name={say('screens.faceEditor.drawnStudio.randomise')}
          isChosen={false}
          onChoose={randomise}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: turns.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                    extrapolate: 'extend',
                  }),
                },
              ],
            }}
          >
            <Icon of={Shuffle} size={18} colour={colours.text} />
          </Animated.View>
        </AFaceChoice>
        {AVATAR_STYLES.map((one) => (
          <AFaceChoice
            key={one}
            label={say('screens.faceEditor.drawnStudio.drawItInTheSTYLENAMES', {
              STYLE_NAMES: AVATAR_STYLE_NAMES[one],
            })}
            name={AVATAR_STYLE_NAMES[one]}
            isChosen={one === style}
            onChoose={() => {
              onChange({ style: one, seed });
            }}
          >
            <View style={[styles.face, isOnColour ? { backgroundColor: colour } : null]}>
              <APicture
                picture={{
                  uri: onThisServer(drawingToShow(one, seed, isOnColour ? settledColour : null)),
                  isDrawn: true,
                }}
                onMissing={() => undefined}
              />
            </View>
          </AFaceChoice>
        ))}
      </ScrollView>

      <AColourSwatches
        value={isOnColour ? colour : ''}
        options={PROFILE_COLOURS}
        onChoose={onColour}
        clear={{ isChosen: !isOnColour, onChoose: onClear }}
      />
    </View>
  );
};

ADrawnStudio.displayName = 'ADrawnStudio';

export { ADrawnStudio };
