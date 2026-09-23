import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { AGlass } from '@ValencePhone/components/AGlass/AGlass';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { hasLiquidGlass } from '@ValencePhone/platform/hasLiquidGlass';
import { usePrefersStillness } from '@ValencePhone/hooks/usePrefersStillness';
import { SPRINGS } from '@ValencePhone/theme/SPRINGS';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { Segment } from '@ValencePhone/components/SegmentedRow/SegmentedRow.types';
import type { ACapsuleRowProps } from './ACapsuleRow.types';

const INSET = 4;

const ACROSS = 14;

const ICON = 18;

const ICON_GAP = 6;

const ICON_ROOM = ICON + ICON_GAP;

const SLIDES = { ...SPRINGS.rise, overshootClamping: true, useNativeDriver: false } as const;

const LEADS = { stiffness: 520, damping: 38, mass: 0.8, useNativeDriver: false } as const;

const FOLLOWS = { stiffness: 200, damping: 26, mass: 1, useNativeDriver: false } as const;

const LIFTS = { duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true } as const;

const SETTLES = { stiffness: 260, damping: 20, mass: 1, useNativeDriver: true } as const;

const LIFTED = 1.15;

const styles = StyleSheet.create({
  capsule: { borderRadius: 999, flexDirection: 'row', overflow: 'hidden', padding: INSET },
  highlight: { borderRadius: 999, bottom: INSET, position: 'absolute', top: INSET },
  pill: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: ACROSS,
    paddingVertical: 9,
  },
  slot: { flexDirection: 'row', overflow: 'hidden' },
  withRoom: { marginRight: ICON_GAP },
});

/**
 * A choice of a few, drawn as the Apple TV app draws the row across the top of it: one capsule of
 * glass holding them all, in words large enough to read at a glance, and a highlight that slides to
 * whichever is picked rather than jumping between them. The one picked shows its icon beside its
 * name, making room for it as the highlight arrives and giving the room back as it leaves, on the
 * same spring, so the row and the highlight move as one.
 *
 * The highlight moves as the Apple TV app's does, like a drop of liquid glass: the end nearest the
 * one picked leaps ahead and the far end is pulled after it, so it stretches on the way and gathers
 * itself on arrival, and it swells and thins a little while it travels before settling. Its ends
 * are moved rather than the whole of it stretched, so they stay round whatever its width. Where
 * somebody has asked for less motion it simply moves.
 *
 * @param label - What is being chosen, for anyone who cannot see the row.
 * @param items - What there is to choose from.
 * @param value - Which one is picked, or none yet.
 * @param onSelect - Told which one they picked.
 */
const ACapsuleRow = ({ label, items, value, onSelect }: ACapsuleRowProps) => {
  const colours = useTheColours();
  const isStill = usePrefersStillness();
  const isGlass = hasLiquidGlass();
  const [named, setNamed] = useState<ReadonlyMap<string, number>>(new Map());
  const [rooms] = useState(() => new Map<string, Animated.Value>());
  const [starts] = useState(() => new Animated.Value(0));
  const [ends] = useState(() => new Animated.Value(0));
  const [lift] = useState(() => new Animated.Value(0));
  const [aimed] = useState(() => new Map<'last' | 'across' | 'landed', string>());
  const pickedAt = items.findIndex((item) => item.id === value);
  const picked = items[pickedAt];
  const isMeasured = items.every((item) => named.has(item.id));

  /**
   * How wide one of them is, with its icon or without.
   *
   * @param item - Which.
   * @param isShowingIcon - Whether its icon is out.
   * @returns Its width.
   */
  const widthOf = (item: Segment, isShowingIcon: boolean) =>
    ACROSS * 2 +
    (named.get(item.id) ?? 0) +
    (isShowingIcon && item.icon !== undefined ? ICON_ROOM : 0);

  /**
   * The room one of them keeps for its icon, which grows and shrinks.
   *
   * @param item - Which.
   * @returns Its room.
   */
  const roomOf = (item: Segment) => {
    const known = rooms.get(item.id);

    if (known !== undefined) {
      return known;
    }

    const made = new Animated.Value(item.id === value && item.icon !== undefined ? ICON_ROOM : 0);

    rooms.set(item.id, made);

    return made;
  };

  const toAcross =
    picked === undefined || !isMeasured
      ? null
      : INSET + items.slice(0, pickedAt).reduce((sum, item) => sum + widthOf(item, false), 0);
  const toWide = picked === undefined || !isMeasured ? null : widthOf(picked, true);

  useEffect(() => {
    if (toAcross === null || toWide === null) {
      return;
    }

    const aim = `${toAcross.toString()}:${toWide.toString()}:${value ?? ''}:${String(isStill)}`;

    if (aimed.get('last') === aim) {
      return;
    }

    aimed.set('last', aim);

    const growing = items.map((item) => ({
      room: roomOf(item),
      toValue: item.id === value && item.icon !== undefined ? ICON_ROOM : 0,
    }));

    const wasAcross = Number(aimed.get('across') ?? toAcross);

    aimed.set('across', toAcross.toString());

    if (aimed.get('landed') !== 'yes' || isStill) {
      starts.setValue(toAcross);
      ends.setValue(toAcross + toWide);
      growing.forEach(({ room, toValue }) => {
        room.setValue(toValue);
      });
      aimed.set('landed', 'yes');

      return;
    }

    const isGoingRight = toAcross > wasAcross;
    const isMoving = toAcross !== wasAcross;

    Animated.parallel([
      Animated.spring(starts, { ...(isGoingRight ? FOLLOWS : LEADS), toValue: toAcross }),
      Animated.spring(ends, { ...(isGoingRight ? LEADS : FOLLOWS), toValue: toAcross + toWide }),
      ...growing.map(({ room, toValue }) => Animated.spring(room, { ...SLIDES, toValue })),
    ]).start();

    if (isMoving) {
      Animated.sequence([
        Animated.timing(lift, { ...LIFTS, toValue: 1 }),
        Animated.spring(lift, { ...SETTLES, toValue: 0 }),
      ]).start();
    }
  });

  return (
    <View
      style={[styles.capsule, isGlass ? null : { backgroundColor: colours.surfaceRaised }]}
      accessibilityRole="tablist"
      accessibilityLabel={label}
    >
      {isGlass ? <AGlass roundness={999} /> : null}

      {toAcross === null ? null : (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }),
              transform: [
                { scaleY: lift.interpolate({ inputRange: [0, 1], outputRange: [1, LIFTED] }) },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.highlight,
              {
                backgroundColor: colours.accent,
                left: starts,
                width: Animated.subtract(ends, starts),
              },
            ]}
          />
        </Animated.View>
      )}

      {items.map((item) => {
        const isChosen = item.id === value;
        const room = roomOf(item);

        return (
          <Button
            key={item.id}
            tone="bare"
            isChosen={isChosen}
            label={item.label}
            onPress={() => {
              onSelect(item.id);
            }}
          >
            <View style={styles.pill}>
              {item.icon === undefined ? null : (
                <Animated.View
                  style={[
                    styles.slot,
                    {
                      opacity: room.interpolate({
                        inputRange: [0, ICON_ROOM],
                        outputRange: [0, 1],
                      }),
                      width: room,
                    },
                  ]}
                >
                  <View style={styles.withRoom}>
                    <Icon
                      of={item.icon}
                      size={ICON}
                      colour={isChosen ? colours.accentContrast : colours.text}
                    />
                  </View>
                </Animated.View>
              )}
              <View
                onLayout={({ nativeEvent }) => {
                  const { width } = nativeEvent.layout;

                  setNamed((was) =>
                    was.get(item.id) === width ? was : new Map(was).set(item.id, width),
                  );
                }}
              >
                <Words tone={isChosen ? 'onAccent' : 'plain'} isStrong>
                  {item.label}
                </Words>
              </View>
            </View>
          </Button>
        );
      })}
    </View>
  );
};

ACapsuleRow.displayName = 'ACapsuleRow';

export { ACapsuleRow };
