import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassTabBar, GlassTabButton } from 'expo-glass-tabs';
import { setMinimized, useMinimizeState } from 'expo-glass-tabs/build/minimize-context';
import { AFadedEdge } from '@ValenceMobile/components/AFadedEdge/AFadedEdge';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { ATabFace } from '@ValenceMobile/components/TheTabs/components/ATabFace/ATabFace';
import { TABS_FOLLOW_SCROLLING } from '@ValenceMobile/components/TheTabs/TABS_FOLLOW_SCROLLING';
import { theColours } from '@ValenceMobile/theme/theColours';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { AGlassTabsProps } from './AGlassTabs.types';

const EXPANDED_NEAR_THE_TOP = 24;

const TURNS_AFTER = 3;

const BLUR_BLEEDS = 44;

const BLUR_FADES_OVER = 0.8;

const styles = StyleSheet.create({
  blurs: { bottom: 0, left: 0, position: 'absolute', right: 0 },
  leftOut: { opacity: 0 },
});

/**
 * The tabs along the foot of the screen, drawn by expo-glass-tabs: a floating pill of liquid glass,
 * or a solid one where the phone has none, whose lens slides to the tab showing, which can be scrubbed
 * along with a finger and a tick at each tab, and which tucks in to its icons alone as a page scrolls
 * down and comes back out as it scrolls up or reaches its top, with the page blurring away beneath it.
 *
 * Behind it the page blurs away towards the foot of the screen as one blur faded out at its top,
 * rather than the library's own, which stacks thin blurs whose edges show as bands across whatever
 * sits just above the bar.
 *
 * The pages report how far they have scrolled through `TABS_FOLLOW_SCROLLING` rather than through
 * the library's own hook, which only a Reanimated scroll view can use; the rule for when it tucks in
 * is the library's. Changing tab brings it back out.
 *
 * @param tabs - The parts there are.
 * @param value - Which one is showing.
 * @param onSelect - Told which one somebody chose, by a press or by letting go of a scrub.
 * @param onMeasure - Told how much of the foot of the screen the bar takes up, safe area and all.
 * @param onFaceAt - Told where on screen the tab drawn as a face shows it, for a face to fly to.
 * @param isFaceArriving - Whether a face is flying in to that tab, which leaves its place empty.
 * @param children - The part showing, which scrolls beneath it.
 */
const AGlassTabs = ({
  tabs,
  value,
  onSelect,
  onMeasure,
  onFaceAt,
  isFaceArriving,
  children,
}: AGlassTabsProps) => {
  const colours = useTheColours();
  const minimized = useMinimizeState();
  const isDark = colours.surface === theColours.dark.surface;
  const [barTall, setBarTall] = useState(0);
  const blurTall = barTall + BLUR_BLEEDS;
  const [lastScrolledTo] = useState(() => new Map([['at', 0]]));

  useEffect(() => {
    setMinimized(minimized, 0);
  }, [value, minimized]);

  const followScrolling = useCallback(
    (scrolledTo: number) => {
      const was = lastScrolledTo.get('at') ?? 0;
      const moved = scrolledTo - was;

      lastScrolledTo.set('at', scrolledTo);

      if (scrolledTo < EXPANDED_NEAR_THE_TOP) {
        setMinimized(minimized, 0);
      } else if (moved > TURNS_AFTER) {
        setMinimized(minimized, 1);
      } else if (moved < -TURNS_AFTER) {
        setMinimized(minimized, 0);
      }
    },
    [lastScrolledTo, minimized],
  );

  return (
    <>
      <TABS_FOLLOW_SCROLLING.Provider value={followScrolling}>
        {children}
      </TABS_FOLLOW_SCROLLING.Provider>

      {barTall === 0 ? null : (
        <View pointerEvents="none" style={[styles.blurs, { height: blurTall }]}>
          <AFadedEdge leading={blurTall * BLUR_FADES_OVER} trailing={0} isUpright>
            <BlurView
              tint={isDark ? 'dark' : 'light'}
              intensity={36}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  experimental_backgroundImage: `linear-gradient(to top, ${withAlpha(colours.surface, 0.7)} 0%, ${withAlpha(colours.surface, 0.3)} 45%, ${withAlpha(colours.surface, 0)} 100%)`,
                },
              ]}
            />
          </AFadedEdge>
        </View>
      )}

      <GlassTabBar
        hasEdgeBlur={false}
        onIndexSelected={(index) => {
          const chosen = tabs[index];

          if (chosen !== undefined) {
            onSelect(chosen.id);
          }
        }}
        theme={{
          activeTint: colours.text,
          inactiveTint: withAlpha(colours.text, 0.62),
          highlight: withAlpha(colours.text, 0.14),
          glassTint: withAlpha(colours.surface, 0.55),
          solidFallback: withAlpha(colours.surfaceRaised, 0.96),
        }}
        onLayout={({ nativeEvent }) => {
          setBarTall(nativeEvent.layout.height);
          onMeasure(nativeEvent.layout.height);
        }}
      >
        {tabs.map((tab, index) => (
          <GlassTabButton
            key={tab.id}
            index={index}
            isFocused={tab.id === value}
            accessibilityLabel={tab.label}
            onPress={() => {
              onSelect(tab.id);
            }}
            item={{
              name: tab.id,
              label: tab.label,
              renderIcon: ({ tint, size }) =>
                tab.face === undefined ? (
                  <Icon of={tab.icon} size={size} colour={tint} />
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
                ),
            }}
          />
        ))}
      </GlassTabBar>
    </>
  );
};

AGlassTabs.displayName = 'AGlassTabs';

export { AGlassTabs };
