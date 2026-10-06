import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { ATabFace } from '@ValenceMobile/components/TheTabs/components/ATabFace/ATabFace';
import { Words } from '@ValenceMobile/components/Words/Words';
import { hasLiquidGlass } from '@ValenceMobile/platform/hasLiquidGlass';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { AFloatingTabsProps } from './AFloatingTabs.types';

const OFF_THE_FOOT = 6;

const ACROSS_FROM_THE_EDGE = 16;

const TALL = 64;

const INSET = 4;

const FADE_ABOVE = 40;

const styles = StyleSheet.create({
  fade: { bottom: 0, left: 0, position: 'absolute', right: 0 },
  lens: {
    borderRadius: (TALL - INSET * 2) / 2,
    bottom: INSET,
    left: 0,
    position: 'absolute',
    top: INSET,
  },
  pill: {
    borderRadius: TALL / 2,
    flexDirection: 'row',
    height: TALL,
    overflow: 'hidden',
    paddingHorizontal: INSET,
  },
  place: { left: ACROSS_FROM_THE_EDGE, position: 'absolute', right: ACROSS_FROM_THE_EDGE },
  tab: { alignItems: 'center', gap: 2, height: TALL, justifyContent: 'center' },
  tabs: { flex: 1 },
  leftOut: { opacity: 0 },
});

/**
 * The tabs along the foot of the screen: a bar floating clear of the edges with the screen running
 * on beneath it, its tabs an icon over a name, and a lens behind the one showing that springs across
 * to whichever is pressed — as the web's tabs move their highlight, and the same on both phones.
 *
 * Where the phone has liquid glass the bar is laid on the system's glass, which only UIKit makes;
 * elsewhere, which is every Android phone, on a tinted surface of its own with a fade rising behind
 * it from the foot, so it reads the same over a poster as over the page.
 *
 * @param tabs - The parts there are.
 * @param value - Which one is showing.
 * @param onSelect - Told which one somebody pressed.
 * @param onMeasure - Told how much of the foot of the screen the bar takes up, safe area and all.
 * @param onFaceAt - Told where on screen the tab drawn as a face shows it, for a face to fly to.
 * @param isFaceArriving - Whether a face is flying in to that tab, which leaves its place empty.
 */
const AFloatingTabs = ({
  tabs,
  value,
  onSelect,
  onMeasure,
  onFaceAt,
  isFaceArriving,
}: AFloatingTabsProps) => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();
  const isStill = usePrefersStillness();
  const isGlass = hasLiquidGlass();
  const above = room.bottom + OFF_THE_FOOT;
  const showing = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === value),
  );
  const [breadth, setBreadth] = useState(0);
  const [lensAt] = useState(() => new Animated.Value(showing));
  const each = breadth / Math.max(1, tabs.length);

  useEffect(() => {
    if (isStill) {
      lensAt.setValue(showing);

      return;
    }

    Animated.spring(lensAt, { toValue: showing, ...SPRINGS.liquid, useNativeDriver: true }).start();
  }, [showing, isStill, lensAt]);

  return (
    <>
      {isGlass ? null : (
        <View
          pointerEvents="none"
          style={[
            styles.fade,
            {
              height: above + TALL + FADE_ABOVE,
              experimental_backgroundImage: `linear-gradient(to top, ${withAlpha(colours.surface, 0.9)} 0%, ${withAlpha(colours.surface, 0.55)} 50%, ${withAlpha(colours.surface, 0)} 100%)`,
            },
          ]}
        />
      )}
      <View
        style={[styles.place, { bottom: above }]}
        onLayout={({ nativeEvent }) => {
          onMeasure(nativeEvent.layout.height + above);
        }}
      >
        <View
          style={[
            styles.pill,
            isGlass
              ? null
              : {
                  backgroundColor: withAlpha(colours.surfaceRaised, 0.98),
                  borderColor: withAlpha(colours.text, 0.1),
                  borderWidth: StyleSheet.hairlineWidth,
                },
          ]}
          onLayout={({ nativeEvent }) => {
            setBreadth(nativeEvent.layout.width - INSET * 2);
          }}
        >
          {isGlass ? <AGlass roundness={TALL / 2} /> : null}
          {each > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.lens,
                {
                  backgroundColor: withAlpha(colours.text, isGlass ? 0.14 : 0.12),
                  left: INSET,
                  transform: [{ translateX: Animated.multiply(lensAt, each) }],
                  width: each,
                },
              ]}
            />
          ) : null}
          {tabs.map((tab) => {
            const isShowing = tab.id === value;
            const ink = isShowing ? colours.text : withAlpha(colours.text, 0.72);

            return (
              <View key={tab.id} style={styles.tabs}>
                <Button
                  tone="bare"
                  label={tab.label}
                  isChosen={isShowing}
                  onPress={() => {
                    onSelect(tab.id);
                  }}
                >
                  <View style={styles.tab}>
                    {tab.face === undefined ? (
                      <Icon of={tab.icon} size={24} colour={ink} />
                    ) : (
                      <View
                        collapsable={false}
                        style={isFaceArriving ? styles.leftOut : null}
                        onLayout={({ currentTarget }) => {
                          if (typeof currentTarget === 'number') {
                            return;
                          }

                          currentTarget.measureInWindow((x, y, width, height) => {
                            onFaceAt?.({ x, y, width, height });
                          });
                        }}
                      >
                        <ATabFace face={tab.face} isShowing={false} />
                      </View>
                    )}
                    <Words size="small" colour={ink}>
                      {tab.label}
                    </Words>
                  </View>
                </Button>
              </View>
            );
          })}
        </View>
      </View>
    </>
  );
};

AFloatingTabs.displayName = 'AFloatingTabs';

export { AFloatingTabs };
