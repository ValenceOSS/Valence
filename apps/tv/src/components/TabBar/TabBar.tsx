import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { StretchPill } from '@ValenceTv/components/StretchPill/StretchPill';
import { tokens } from '@ValenceTv/theme/tokens';
import type { TabBarProps } from './TabBar.types';

const ICON_SIZE = 28;

const SLIDES = { stiffness: 182, damping: 21, mass: 1, useNativeDriver: true };

const QUIET = 0.16;

type Place = { x: number; y: number; width: number; height: number };

/**
 * A row of tabs as the television's own apps draw them: soft pills, the one showing on a quiet fill
 * with its icon, the rest just words, and the one the remote is on lit white.
 *
 * Landing on a tab is choosing it — the page beneath changes as the remote moves along the row,
 * without a press — because that is how every other tab bar on the television behaves. One pill sits
 * behind the tabs and springs from tab to tab as the remote moves, as the web's does, lit white while
 * the remote is in the row and a quiet fill once it has gone down into the page; the tabs themselves
 * only change colour. The pill moves by transforms alone, since Android does not animate a change of
 * layout.
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
  const [pillX] = useState(() => new Animated.Value(0));
  const [pillWidth] = useState(() => new Animated.Value(0));
  const isPlaced = useRef(false);

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

  useEffect(() => {
    if (at === undefined) {
      return;
    }

    if (!isPlaced.current) {
      isPlaced.current = true;
      pillX.setValue(at.x);
      pillWidth.setValue(at.width);

      return;
    }

    Animated.parallel([
      Animated.spring(pillX, { ...SLIDES, toValue: at.x }),
      Animated.spring(pillWidth, { ...SLIDES, toValue: at.width }),
    ]).start();
  }, [at, pillX, pillWidth]);

  return (
    <TVFocusGuideView autoFocus style={styles.bar}>
      {at === undefined ? null : (
        <View
          pointerEvents="none"
          needsOffscreenAlphaCompositing
          style={[styles.mark, { top: at.y, height: at.height, opacity: isInRow ? 1 : QUIET }]}
        >
          <StretchPill x={pillX} width={pillWidth} height={at.height} colour="#ffffff" />
        </View>
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
  mark: { position: 'absolute', left: 0, right: 0 },
  label: { fontSize: tokens.type.body - 2, fontWeight: '500' },
  labelCurrent: { fontWeight: '600' },
});

export { TabBar };
