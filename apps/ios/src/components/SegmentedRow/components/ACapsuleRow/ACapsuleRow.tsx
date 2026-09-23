import { useState } from 'react';
import { LayoutAnimation, StyleSheet, View } from 'react-native';
import { AGlass } from '@ValencePhone/components/AGlass/AGlass';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { hasLiquidGlass } from '@ValencePhone/platform/hasLiquidGlass';
import { usePrefersStillness } from '@ValencePhone/hooks/usePrefersStillness';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { ACapsuleRowProps } from './ACapsuleRow.types';

const INSET = 4;

const ICON = 18;

const SLIDES = {
  duration: 380,
  update: { type: LayoutAnimation.Types.spring, springDamping: 0.78 },
};

type Place = { x: number; width: number };

const styles = StyleSheet.create({
  capsule: { borderRadius: 999, flexDirection: 'row', overflow: 'hidden', padding: INSET },
  highlight: { borderRadius: 999, bottom: INSET, position: 'absolute', top: INSET },
  pill: {
    alignItems: 'center',
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
 */
const ACapsuleRow = ({ label, items, value, onSelect }: ACapsuleRowProps) => {
  const colours = useTheColours();
  const isStill = usePrefersStillness();
  const isGlass = hasLiquidGlass();
  const [places, setPlaces] = useState<ReadonlyMap<string, Place>>(new Map());
  const at = value === null ? undefined : places.get(value);

  return (
    <View
      style={[styles.capsule, isGlass ? null : { backgroundColor: colours.surfaceRaised }]}
      accessibilityRole="tablist"
      accessibilityLabel={label}
    >
      {isGlass ? <AGlass roundness={999} /> : null}

      {at === undefined ? null : (
        <View
          pointerEvents="none"
          style={[
            styles.highlight,
            { backgroundColor: colours.accent, left: at.x, width: at.width },
          ]}
        />
      )}

      {items.map((item) => {
        const isChosen = item.id === value;

        return (
          <View
            key={item.id}
            collapsable={false}
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
          </View>
        );
      })}
    </View>
  );
};

ACapsuleRow.displayName = 'ACapsuleRow';

export { ACapsuleRow };
