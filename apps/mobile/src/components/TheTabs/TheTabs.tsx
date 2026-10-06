import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { AFloatingTabs } from '@ValenceMobile/components/TheTabs/components/AFloatingTabs/AFloatingTabs';
import { ATabFace } from '@ValenceMobile/components/TheTabs/components/ATabFace/ATabFace';
import { Words } from '@ValenceMobile/components/Words/Words';
import { hasLiquidGlass } from '@ValenceMobile/platform/hasLiquidGlass';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheTabsProps } from './TheTabs.types';

const A_GUESS_AT_THE_BAR = 62;

const ABOVE_THE_BAR = 8;

const styles = StyleSheet.create({
  above: { left: 12, position: 'absolute', right: 12 },
  bar: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingTop: 8 },
  beforeTheBar: { paddingHorizontal: 12 },
  tab: { alignItems: 'center', gap: 3, paddingVertical: 2 },
  leftOut: { opacity: 0 },
  whole: { flex: 1 },
});

/**
 * The part of the app showing, with the tabs that move between the parts along the bottom.
 *
 * On a phone with liquid glass, and on every Android phone, the tabs are a bar of our own floating
 * over the screen — laid on the glass where there is glass — and the screen runs on underneath with
 * room at its foot to scroll clear. An older iPhone has a strip of our own beneath the screen. Anything kept above the tabs is given room the same way, so the screen
 * scrolls clear of that too, and is only spaced off the tabs while it shows anything.
 *
 * @param tabs - The parts there are.
 * @param value - Which one is showing.
 * @param onSelect - Told which one somebody pressed.
 * @param children - The part showing.
 * @param above - What sits just above the tabs whichever part is showing — what music is playing.
 * @param onFaceAt - Told where on screen the tab drawn as a face shows it, for a face to fly to.
 * @param isFaceArriving - Whether a face is flying in to that tab, which leaves its place empty till then.
 */
const TheTabs = ({
  tabs,
  value,
  onSelect,
  children,
  above,
  onFaceAt,
  isFaceArriving = false,
}: TheTabsProps) => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();
  const [barHeight, setBarHeight] = useState(room.bottom + A_GUESS_AT_THE_BAR);
  const [aboveHigh, setAboveHigh] = useState(0);
  const clearOfAbove = aboveHigh > 0 ? aboveHigh + ABOVE_THE_BAR : 0;

  if (Platform.OS === 'android' || hasLiquidGlass()) {
    return (
      <View style={[styles.whole, { backgroundColor: colours.surface }]}>
        <SafeAreaInsetsContext.Provider value={{ ...room, bottom: barHeight + clearOfAbove }}>
          {children}
        </SafeAreaInsetsContext.Provider>
        <AFloatingTabs
          tabs={tabs}
          value={value}
          onSelect={onSelect}
          onMeasure={setBarHeight}
          isFaceArriving={isFaceArriving}
          {...(onFaceAt === undefined ? {} : { onFaceAt })}
        />
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
      </View>
    );
  }

  return (
    <View style={[styles.whole, { backgroundColor: colours.surface }]}>
      <SafeAreaInsetsContext.Provider value={{ ...room, bottom: 0 }}>
        <View style={styles.whole}>{children}</View>
      </SafeAreaInsetsContext.Provider>

      {above === undefined ? null : (
        <View style={[styles.beforeTheBar, { paddingBottom: aboveHigh > 0 ? ABOVE_THE_BAR : 0 }]}>
          <View
            onLayout={(event) => {
              setAboveHigh(event.nativeEvent.layout.height);
            }}
          >
            {above}
          </View>
        </View>
      )}

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
