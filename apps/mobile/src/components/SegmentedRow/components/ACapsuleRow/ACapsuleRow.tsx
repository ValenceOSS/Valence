import { useEffect, useState } from 'react';
import { Animated, Easing, LayoutAnimation, StyleSheet, View } from 'react-native';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { hasLiquidGlass } from '@ValenceMobile/platform/hasLiquidGlass';
import { usePrefersStillness } from '@ValenceMobile/hooks/usePrefersStillness';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ACapsuleRowProps } from './ACapsuleRow.types';

const INSET = 4;

const SHOWS_OVER = 260;

const ICON = 18;

const SLIDES = {
  duration: 380,
  update: { type: LayoutAnimation.Types.spring, springDamping: 0.78 },
};

type Place = { x: number; width: number };

const styles = StyleSheet.create({
  capsule: { borderRadius: 999, flexDirection: 'row', overflow: 'hidden', padding: INSET },
  filling: { flexGrow: 1 },
  highlight: { borderRadius: 999, bottom: INSET, position: 'absolute', top: INSET },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
});

/**
 * A choice of a few, drawn as the Apple TV app draws the row across the top of it: one capsule of
 * glass holding them all, in words large enough to read at a glance, and a highlight that slides to
 * whichever is picked rather than jumping between them, with the one picked showing its icon beside
 * its name.
 *
 * It moves the way the television's own row does. Each choice says where it sits, the highlight is
 * laid over the one picked, and as somebody picks another the system is asked to spring whatever
 * that changes into place — the highlight sliding and resizing, and the row making room for the
 * icon — so the whole of it moves on the native side in one animation, with nothing redrawn from
 * JavaScript frame by frame. Where somebody has asked for less motion it simply moves.
 *
 * @param label - What is being chosen, for anyone who cannot see the row.
 * @param items - What there is to choose from.
 * @param value - Which one is picked, or none yet.
 * @param onSelect - Told which one they picked.
 * @param fills - Whether it stretches across the width it is given, its choices spread along it.
 * @param isShown - Whether it is showing: its glass eases in and out on the native side and the rest
 *   fades, since glass does not render under anything faded from outside it.
 */
const ACapsuleRow = ({
  label,
  items,
  value,
  onSelect,
  fills = false,
  isShown = true,
}: ACapsuleRowProps) => {
  const colours = useTheColours();
  const isStill = usePrefersStillness();
  const isGlass = hasLiquidGlass();
  const [places, setPlaces] = useState<ReadonlyMap<string, Place>>(new Map());
  const at = value === null ? undefined : places.get(value);
  const [seen] = useState(() => new Animated.Value(isShown ? 1 : 0));

  useEffect(() => {
    Animated.timing(seen, {
      toValue: isShown ? 1 : 0,
      duration: SHOWS_OVER,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isShown, seen]);

  return (
    <View
      style={[styles.capsule, fills && styles.filling]}
      accessibilityRole="tablist"
      accessibilityLabel={label}
    >
      {isGlass ? (
        <AGlass roundness={999} isShown={isShown} />
      ) : (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colours.surfaceRaised, opacity: seen },
          ]}
        />
      )}

      {at === undefined ? null : (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.highlight,
            { backgroundColor: colours.accent, left: at.x, opacity: seen, width: at.width },
          ]}
        />
      )}

      {items.map((item) => {
        const isChosen = item.id === value;

        return (
          <Animated.View
            key={item.id}
            collapsable={false}
            style={[fills ? styles.filling : null, { opacity: seen }]}
            onLayout={({ nativeEvent }) => {
              const { x, width } = nativeEvent.layout;

              setPlaces((was) => {
                const had = was.get(item.id);

                return had !== undefined && had.x === x && had.width === width
                  ? was
                  : new Map(was).set(item.id, { x, width });
              });
            }}
          >
            <Button
              tone="bare"
              isChosen={isChosen}
              label={item.label}
              onPress={() => {
                if (!isStill && !isChosen) {
                  LayoutAnimation.configureNext(SLIDES);
                }

                onSelect(item.id);
              }}
            >
              <View style={styles.pill}>
                {isChosen && item.icon !== undefined ? (
                  <Icon of={item.icon} size={ICON} colour={colours.accentContrast} />
                ) : null}

                <Words tone={isChosen ? 'onAccent' : 'plain'} isStrong>
                  {item.label}
                </Words>
              </View>
            </Button>
          </Animated.View>
        );
      })}
    </View>
  );
};

ACapsuleRow.displayName = 'ACapsuleRow';

export { ACapsuleRow };
