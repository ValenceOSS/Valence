import { useMemo, useState } from 'react';
import { LayoutAnimation, StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { tokens } from '@ValenceTv/theme/tokens';
import type { TabBarProps } from './TabBar.types';

const ICON_SIZE = 28;

const SLIDES = {
  duration: 380,
  update: { type: LayoutAnimation.Types.spring, springDamping: 0.78 },
};

type Place = { x: number; y: number; width: number; height: number };

/**
 * A row of tabs as the television's own apps draw them: soft pills, the one showing on a quiet fill
 * with its icon, the rest just words, and the one the remote is on lit white.
 *
 * Landing on a tab is choosing it — the page beneath changes as the remote moves along the row,
 * without a press — because that is how every other tab bar on the television behaves. One pill sits
 * behind the tabs and springs from tab to tab as the remote moves, as the web's does, lit white while
 * the remote is in the row and a quiet fill once it has gone down into the page; the tabs themselves
 * only change colour.
 *
 * Coming up into the row lands on the tab showing rather than whichever is nearest, so moving up
 * from the page never changes it by accident.
 *
 * @param tabs - The parts there are, in order, each with the icon it shows while it is the one open.
 * @param current - The one showing.
 * @param onChoose - Told which part the remote moved to.
 * @param isStartingHere - Whether the remote starts on the current tab when the screen appears.
 * @param onFocusChange - Told when the remote comes onto a tab and when it leaves one.
 * @param itemRef - Handed each tab by its name, for anything that sends the remote up to one.
 */
const TabBar = <Tab extends string>({
  tabs,
  current,
  onChoose,
  isStartingHere = false,
  onFocusChange,
  itemRef,
}: TabBarProps<Tab>) => {
  const [places, setPlaces] = useState<ReadonlyMap<Tab, Place>>(new Map());
  const [isInRow, setIsInRow] = useState(false);

  const refs = useMemo(
    () =>
      new Map(
        tabs.map((tab) => [
          tab.id,
          (item: View | null) => {
            itemRef?.(tab.id, item);
          },
        ]),
      ),
    [tabs, itemRef],
  );

  const at = places.get(current);

  return (
    <TVFocusGuideView autoFocus style={styles.bar}>
      {at === undefined ? null : (
        <View
          pointerEvents="none"
          style={[
            styles.mark,
            { left: at.x, top: at.y, width: at.width, height: at.height },
            isInRow ? styles.markLit : styles.markQuiet,
          ]}
        />
      )}

      {tabs.map((tab) => (
        <View
          key={tab.id}
          collapsable={false}
          onLayout={(event) => {
            const { x, y, width, height } = event.nativeEvent.layout;

            setPlaces((was) => {
              const had = was.get(tab.id);

              if (
                had !== undefined &&
                had.x === x &&
                had.y === y &&
                had.width === width &&
                had.height === height
              ) {
                return was;
              }

              return new Map(was).set(tab.id, { x, y, width, height });
            });
          }}
        >
          <Focusable
            ref={refs.get(tab.id)}
            label={tab.label}
            hasPreferredFocus={isStartingHere && tab.id === current}
            scale={1}
            onFocus={() => {
              LayoutAnimation.configureNext(SLIDES);

              if (tab.id !== current) {
                onChoose(tab.id);
              }

              setIsInRow(true);
              onFocusChange?.(true);
            }}
            onBlur={() => {
              setIsInRow(false);
              onFocusChange?.(false);
            }}
            onPress={() => {
              onChoose(tab.id);
            }}
          >
            {(isFocused) => {
              const isCurrent = tab.id === current;
              const ink = isFocused
                ? tokens.colours.onWhite
                : isCurrent
                  ? tokens.colours.text
                  : tokens.colours.muted;

              return (
                <View style={styles.tab}>
                  {isCurrent && tab.icon !== undefined ? (
                    <Icon of={tab.icon} colour={ink} size={ICON_SIZE} />
                  ) : null}

                  <Text style={[styles.label, { color: ink }, isCurrent && styles.labelCurrent]}>
                    {tab.label}
                  </Text>
                </View>
              );
            }}
          </Focusable>
        </View>
      ))}
    </TVFocusGuideView>
  );
};

TabBar.displayName = 'TabBar';

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.xs },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.xs,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm - 4,
    borderRadius: tokens.radii.round,
  },
  mark: { position: 'absolute', borderRadius: tokens.radii.round },
  markQuiet: { backgroundColor: 'rgba(255,255,255,0.16)' },
  markLit: { backgroundColor: '#ffffff' },
  label: { fontSize: tokens.type.body - 2, fontWeight: '500' },
  labelCurrent: { fontWeight: '600' },
});

export { TabBar };
