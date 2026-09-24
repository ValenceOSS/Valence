import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { ATabFace } from '@ValencePhone/components/TheTabs/components/ATabFace/ATabFace';
import { SystemTabBar } from '@ValencePhone/components/SystemTabBar/SystemTabBar';
import { Words } from '@ValencePhone/components/Words/Words';
import { hasLiquidGlass } from '@ValencePhone/platform/hasLiquidGlass';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheTabsProps } from './TheTabs.types';

const A_GUESS_AT_THE_BAR = 62;

const ABOVE_THE_BAR = 8;

const styles = StyleSheet.create({
  above: { left: 12, position: 'absolute', right: 12 },
  bar: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingTop: 8 },
  beforeTheBar: { paddingBottom: ABOVE_THE_BAR, paddingHorizontal: 12 },
  system: { bottom: 0, left: 0, position: 'absolute', right: 0 },
  tab: { alignItems: 'center', gap: 3, paddingVertical: 2 },
  whole: { flex: 1 },
});

/**
 * The part of the app showing, with the tabs that move between the parts along the bottom.
 *
 * Where the phone has liquid glass the tabs are the system's own bar, floating over the screen with
 * the lens that can be held and slid between them, and the screen runs on underneath with room at
 * its foot to scroll clear. Anywhere older they are a bar of our own beneath it. Anything kept above
 * the tabs is given room the same way, so the screen scrolls clear of that too.
 *
 * @param tabs - The parts there are.
 * @param value - Which one is showing.
 * @param onSelect - Told which one somebody pressed.
 * @param children - The part showing.
 * @param above - What sits just above the tabs whichever part is showing — what music is playing.
 * @param onFaceAt - Told where on screen the tab drawn as a face shows it, for a face to fly to.
 */
const TheTabs = ({ tabs, value, onSelect, children, above, onFaceAt }: TheTabsProps) => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();
  const [barHeight, setBarHeight] = useState(room.bottom + A_GUESS_AT_THE_BAR);
  const [aboveHigh, setAboveHigh] = useState(0);
  const clearOfAbove = aboveHigh > 0 ? aboveHigh + ABOVE_THE_BAR : 0;

  if (hasLiquidGlass()) {
    return (
      <View style={styles.whole}>
        <SafeAreaInsetsContext.Provider value={{ ...room, bottom: barHeight + clearOfAbove }}>
          {children}
        </SafeAreaInsetsContext.Provider>

        {above === undefined ? null : (
          <View
            style={[styles.above, { bottom: barHeight + ABOVE_THE_BAR }]}
            onLayout={(event) => {
              setAboveHigh(event.nativeEvent.layout.height);
            }}
          >
            {above}
          </View>
        )}

        <SystemTabBar
          tabs={tabs.map((tab) => ({
            id: tab.id,
            title: tab.label,
            symbol: tab.symbol,
            ...(tab.face === undefined
              ? {}
              : {
                  picture: tab.face.picture?.uri ?? null,
                  backdrop: tab.face.backdrop,
                  initial: tab.face.initial,
                }),
          }))}
          selected={value}
          accent={colours.accent}
          onSelect={onSelect}
          onMeasure={setBarHeight}
          {...(onFaceAt === undefined ? {} : { onFaceAt })}
          style={[styles.system, { height: barHeight }]}
        />
      </View>
    );
  }

  return (
    <View style={styles.whole}>
      <SafeAreaInsetsContext.Provider value={{ ...room, bottom: 0 }}>
        <View style={styles.whole}>{children}</View>
      </SafeAreaInsetsContext.Provider>

      {above === undefined ? null : <View style={styles.beforeTheBar}>{above}</View>}

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
        {tabs.map((tab) => {
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
                <View style={styles.tab}>
                  {tab.face === undefined ? (
                    <Icon
                      of={tab.icon}
                      size={24}
                      colour={isShowing ? colours.accent : colours.textMuted}
                    />
                  ) : (
                    <View
                      collapsable={false}
                      onLayout={(event) => {
                        event.currentTarget.measureInWindow((x, y, width, height) => {
                          onFaceAt?.({ x, y, width, height });
                        });
                      }}
                    >
                      <ATabFace face={tab.face} isShowing={isShowing} />
                    </View>
                  )}
                  <Words size="small" tone={isShowing ? 'accent' : 'muted'}>
                    {tab.label}
                  </Words>
                </View>
              </Button>
            </View>
          );
        })}
      </View>
    </View>
  );
};

TheTabs.displayName = 'TheTabs';

export { TheTabs };
