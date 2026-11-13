import { useContext, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { hexOfHsv } from '@ValenceCore/functions/hexOfHsv';
import { hsvOf } from '@ValenceCore/functions/hsvOf';
import { SHEET_HOLD } from '@ValenceMobile/components/ASheet/SHEET_HOLD';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { HUES } from '@ValenceMobile/pictures/HUES';
import type { AColourPickerProps } from './AColourPicker.types';
import { say } from '@ValenceI18n/say';

const HEX = /^#[0-9a-f]{6}$/iu;

const FIELD = 180;

const STRIP = 28;

const THUMB = 32;

const ROUNDED = 14;

const styles = StyleSheet.create({
  field: { height: FIELD },
  hex: { flex: 1 },
  picker: { gap: 18, padding: THUMB / 2 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  sample: { borderRadius: 12, borderWidth: 1, height: 44, width: 44 },
  strip: { height: STRIP, justifyContent: 'center' },
  thumb: {
    borderRadius: THUMB / 2,
    borderWidth: 3,
    height: THUMB,
    marginLeft: -THUMB / 2,
    marginTop: -THUMB / 2,
    position: 'absolute',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
    width: THUMB,
  },
});

/**
 * Where a finger is along a box, from nothing to one, held inside it.
 *
 * @param at - How far in the finger is.
 * @param length - How long the box is.
 * @returns The share of the way along.
 */
const along = (at: number, length: number): number =>
  length <= 0 ? 0 : Math.min(Math.max(at / length, 0), 1);

/**
 * Picks any colour at all, as the web's picker does: a field of every shade of one hue, a strip of
 * every hue, and the colour written out as a hex code for somebody who already knows the one they
 * want. The field and strip follow a finger dragged anywhere across them, holding the sheet they
 * are in still meanwhile. Each handle is the web's: the colour it is on, ringed in the sheet's own
 * colour and lifted by a shadow, sat exactly where its colour is, corners and ends included, with
 * room around the picker so none is cut off.
 *
 * @param value - The colour now, as `#rrggbb`, or empty where there is none yet.
 * @param onChange - Told the new colour as it moves.
 */
const AColourPicker = ({ value, onChange }: AColourPickerProps) => {
  const colours = useTheColours();
  const holdSheet = useContext(SHEET_HOLD);
  const [hsv, setHsv] = useState(() => hsvOf(value));
  const shown = HEX.test(value) ? value : hexOfHsv(hsv.hue, hsv.saturation, hsv.brightness);
  const [typed, setTyped] = useState(shown);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!HEX.test(value)) {
      return;
    }

    setHsv((was) =>
      hexOfHsv(was.hue, was.saturation, was.brightness) === value.toLowerCase()
        ? was
        : hsvOf(value),
    );
    setTyped((was) => (was.toLowerCase() === value.toLowerCase() ? was : value));
  }, [value]);

  const move = (next: { hue: number; saturation: number; brightness: number }) => {
    const hex = hexOfHsv(next.hue, next.saturation, next.brightness);

    setHsv(next);
    setTyped(hex);
    onChange(hex);
  };

  const dragged = (onto: (event: GestureResponderEvent) => void) => ({
    onStartShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (event: GestureResponderEvent) => {
      holdSheet?.(true);
      onto(event);
    },
    onResponderMove: onto,
    onResponderRelease: () => {
      holdSheet?.(false);
    },
    onResponderTerminate: () => {
      holdSheet?.(false);
    },
  });

  const pure = hexOfHsv(hsv.hue, 1, 1);

  return (
    <View
      style={styles.picker}
      onLayout={({ nativeEvent }) => {
        setWidth(nativeEvent.layout.width - THUMB);
      }}
    >
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={say('common.shade')}
        style={styles.field}
        {...dragged(({ nativeEvent }) => {
          move({
            ...hsv,
            saturation: along(nativeEvent.locationX, width),
            brightness: 1 - along(nativeEvent.locationY, FIELD),
          });
        })}
      >
        {width === 0 ? null : (
          <Canvas style={{ width, height: FIELD }} pointerEvents="none">
            <RoundedRect x={0} y={0} width={width} height={FIELD} r={ROUNDED} color={pure} />
            <RoundedRect x={0} y={0} width={width} height={FIELD} r={ROUNDED}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(width, 0)}
                colors={['#ffffffff', '#ffffff00']}
              />
            </RoundedRect>
            <RoundedRect x={0} y={0} width={width} height={FIELD} r={ROUNDED}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, FIELD)}
                colors={['#00000000', '#000000ff']}
              />
            </RoundedRect>
          </Canvas>
        )}
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              backgroundColor: shown,
              borderColor: colours.surface,
              left: hsv.saturation * width,
              top: (1 - hsv.brightness) * FIELD,
            },
          ]}
        />
      </View>

      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={say('common.hue')}
        style={styles.strip}
        {...dragged(({ nativeEvent }) => {
          move({ ...hsv, hue: along(nativeEvent.locationX, width) * 359.9 });
        })}
      >
        {width === 0 ? null : (
          <Canvas style={{ width, height: STRIP }} pointerEvents="none">
            <RoundedRect x={0} y={0} width={width} height={STRIP} r={STRIP / 2}>
              <LinearGradient start={vec(0, 0)} end={vec(width, 0)} colors={HUES} />
            </RoundedRect>
          </Canvas>
        )}
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              backgroundColor: pure,
              borderColor: colours.surface,
              left: (hsv.hue / 360) * width,
              top: STRIP / 2,
            },
          ]}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.sample, { backgroundColor: shown, borderColor: colours.border }]} />
        <View style={styles.hex}>
          <TextField
            label={say('common.hexCode')}
            isLabelHidden
            value={typed}
            onValueChange={(next) => {
              const hex = next.startsWith('#') ? next : `#${next}`;

              setTyped(hex);

              if (HEX.test(hex)) {
                setHsv(hsvOf(hex));
                onChange(hex.toLowerCase());
              }
            }}
          />
        </View>
      </View>
    </View>
  );
};

AColourPicker.displayName = 'AColourPicker';

export { AColourPicker };
