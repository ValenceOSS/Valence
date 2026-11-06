import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Brightness from 'expo-brightness';
import { Check, SunDim, Sun } from '@keyline-icons/react-native';
import { READING_THEME_IDS } from '@ValenceCore/tokens/READING_THEME_IDS';
import { READING_THEMES } from '@ValenceCore/tokens/READING_THEMES';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { READING_SERIF } from '@ValenceMobile/theme/READING_SERIF';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AReadingLookProps } from './AReadingLook.types';
import { say } from '@ValenceI18n/say';

const BRIGHTNESS_STEP = 0.1;

const NAMES: Readonly<Record<AReadingLookProps['theme'], string>> = {
  original: say('phone.aReader.aReadingLook.original'),
  quiet: say('phone.aReader.aReadingLook.quiet'),
  paper: say('phone.aReader.aReadingLook.paper'),
  bold: say('phone.aReader.aReadingLook.bold'),
  calm: say('phone.aReader.aReadingLook.calm'),
  focus: say('phone.aReader.aReadingLook.focus'),
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 9,
    bottom: 8,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    width: 18,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  half: {
    alignItems: 'center',
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  pair: { borderRadius: 23, flex: 1, flexDirection: 'row', overflow: 'hidden' },
  pairs: { flexDirection: 'row', gap: 12 },
  sample: { fontSize: 26, lineHeight: 32 },
  seam: { width: StyleSheet.hairlineWidth },
  tile: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    gap: 2,
    height: 92,
    justifyContent: 'center',
  },
  tileReach: { width: '31%', flexGrow: 1 },
  whole: { gap: 18 },
});

/**
 * How a book looks while it is read, laid out as Apple Books lays it out: the words smaller or
 * larger and the screen dimmer or brighter as two pairs of buttons, and the themes as swatches, each
 * showing its page and its type, the one in use ticked.
 *
 * The brightness is the screen's own, so it holds when the book is put down, as the phone's control
 * centre's does.
 *
 * @param theme - The theme in use.
 * @param onTheme - Told a theme was chosen.
 * @param onSmaller - Makes the words smaller, where they can be.
 * @param onLarger - Makes the words larger, where they can be.
 */
const AReadingLook = ({ theme, onTheme, onSmaller, onLarger }: AReadingLookProps) => {
  const colours = useTheColours();
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    void Brightness.getBrightnessAsync()
      .then(setLevel)
      .catch(() => {
        setLevel(null);
      });
  }, []);

  /**
   * Moves the screen's brightness a step.
   *
   * @param by - A step up or down.
   */
  const brighten = (by: 1 | -1) => {
    const next = Math.min(Math.max((level ?? 0.5) + by * BRIGHTNESS_STEP, 0), 1);

    setLevel(next);
    void Brightness.setBrightnessAsync(next).catch(() => undefined);
  };

  const pairLook = { backgroundColor: colours.surfaceRaised };
  const seamLook = { backgroundColor: colours.border };

  return (
    <View style={styles.whole}>
      <View style={styles.pairs}>
        <View style={[styles.pair, pairLook]}>
          <View style={styles.half}>
            <Button
              tone="bare"
              label={say('phone.aReader.aReadingLook.smallerText')}
              isDisabled={onSmaller === null}
              onPress={() => {
                onSmaller?.();
              }}
            >
              <Words size="small" colour={colours.text}>
                {say('phone.aReader.aReadingLook.letter')}
              </Words>
            </Button>
          </View>
          <View style={[styles.seam, seamLook]} />
          <View style={styles.half}>
            <Button
              tone="bare"
              label={say('phone.aReader.aReadingLook.largerText')}
              isDisabled={onLarger === null}
              onPress={() => {
                onLarger?.();
              }}
            >
              <Words size="heading" colour={colours.text}>
                {say('phone.aReader.aReadingLook.letter')}
              </Words>
            </Button>
          </View>
        </View>

        <View style={[styles.pair, pairLook]}>
          <View style={styles.half}>
            <Button
              tone="bare"
              label={say('phone.aReader.aReadingLook.dimmer')}
              isDisabled={level === null || level <= 0}
              onPress={() => {
                brighten(-1);
              }}
            >
              <Icon of={SunDim} size={18} colour={colours.text} />
            </Button>
          </View>
          <View style={[styles.seam, seamLook]} />
          <View style={styles.half}>
            <Button
              tone="bare"
              label={say('phone.aReader.aReadingLook.brighter')}
              isDisabled={level === null || level >= 1}
              onPress={() => {
                brighten(1);
              }}
            >
              <Icon of={Sun} size={22} colour={colours.text} />
            </Button>
          </View>
        </View>
      </View>

      <View style={styles.grid} accessibilityLabel={say('phone.aReader.aReadingLook.themes')}>
        {READING_THEME_IDS.map((id) => {
          const look = READING_THEMES[id];
          const isChosen = id === theme;

          return (
            <View key={id} style={styles.tileReach}>
              <Button
                tone="bare"
                label={say('phone.aReader.aReadingLook.useNameTheme', { name: NAMES[id] })}
                isChosen={isChosen}
                onPress={() => {
                  onTheme(id);
                }}
              >
                <View
                  style={[
                    styles.tile,
                    {
                      backgroundColor: look.paper,
                      borderColor: isChosen ? colours.text : colours.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sample,
                      {
                        color: look.ink,
                        fontFamily: look.isBold ? READING_SERIF.bold : READING_SERIF.regular,
                      },
                    ]}
                  >
                    {say('phone.aReader.aReadingLook.sample')}
                  </Text>
                  <Words size="small" colour={look.ink}>
                    {NAMES[id]}
                  </Words>
                  {isChosen ? (
                    <View style={[styles.badge, { backgroundColor: look.ink }]}>
                      <Icon of={Check} size={12} colour={look.paper} />
                    </View>
                  ) : null}
                </View>
              </Button>
            </View>
          );
        })}
      </View>
    </View>
  );
};

AReadingLook.displayName = 'AReadingLook';

export { AReadingLook };
