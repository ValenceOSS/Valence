import { StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheTabsProps } from './TheTabs.types';

const DOCK = 62;

const DOCK_EDGE = 20;

const ABOVE_THE_HOME_BAR = 12;

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingTop: 8 },
  chosen: {
    borderRadius: DOCK / 2,
    bottom: 4,
    left: 0,
    opacity: 0.1,
    position: 'absolute',
    right: 0,
    top: 4,
  },
  dock: {
    borderRadius: DOCK / 2,
    flexDirection: 'row',
    height: DOCK,
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  floating: { left: DOCK_EDGE, position: 'absolute', right: DOCK_EDGE },
  tab: { alignItems: 'center', gap: 3, paddingVertical: 2 },
  tabInDock: { alignItems: 'center', gap: 2, height: DOCK, justifyContent: 'center' },
  whole: { flex: 1 },
});

/**
 * The part of the app showing, with the tabs that move between the parts along the bottom.
 *
 * Where the phone has liquid glass the tabs float over the screen in a glass capsule, as the
 * system's own do, and the screen runs on underneath them with room left at its foot to scroll
 * clear. Anywhere older they sit in a bar beneath it.
 *
 * @param tabs - The parts there are.
 * @param value - Which one is showing.
 * @param onSelect - Told which one somebody pressed.
 * @param children - The part showing.
 */
const TheTabs = ({ tabs, value, onSelect, children }: TheTabsProps) => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();
  const isGlass = isLiquidGlassAvailable();

  const eachTab = (isInDock: boolean) =>
    tabs.map((tab) => {
      const isShowing = tab.id === value;

      return (
        <View key={tab.id} style={styles.whole}>
          <Button
            tone="bare"
            label={tab.label}
            isChosen={isShowing}
            onPress={() => {
              onSelect(tab.id);
            }}
          >
            <View style={isInDock ? styles.tabInDock : styles.tab}>
              {isInDock && isShowing ? (
                <View style={[styles.chosen, { backgroundColor: colours.text }]} />
              ) : null}
              <Icon
                of={tab.icon}
                size={24}
                colour={isShowing ? colours.accent : colours.textMuted}
              />
              <Words size="small" tone={isShowing ? 'accent' : 'muted'}>
                {tab.label}
              </Words>
            </View>
          </Button>
        </View>
      );
    });

  if (isGlass) {
    const dockBottom = Math.max(room.bottom - ABOVE_THE_HOME_BAR, ABOVE_THE_HOME_BAR);

    return (
      <View style={styles.whole}>
        <SafeAreaInsetsContext.Provider value={{ ...room, bottom: dockBottom + DOCK }}>
          {children}
        </SafeAreaInsetsContext.Provider>

        <View style={[styles.floating, { bottom: dockBottom }]}>
          <GlassView glassEffectStyle="regular" isInteractive style={styles.dock}>
            {eachTab(true)}
          </GlassView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.whole}>
      <SafeAreaInsetsContext.Provider value={{ ...room, bottom: 0 }}>
        <View style={styles.whole}>{children}</View>
      </SafeAreaInsetsContext.Provider>

      <View
        style={[
          styles.bar,
          {
            backgroundColor: colours.surface,
            borderTopColor: colours.border,
            paddingBottom: Math.max(room.bottom, 8),
          },
        ]}
      >
        {eachTab(false)}
      </View>
    </View>
  );
};

TheTabs.displayName = 'TheTabs';

export { TheTabs };
