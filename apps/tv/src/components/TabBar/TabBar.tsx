import { StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { tokens } from '@ValenceTv/theme/tokens';
import type { TabBarProps } from './TabBar.types';

const ICON_SIZE = 28;

/**
 * A row of tabs as the television's own apps draw them: soft pills, the one showing on a quiet fill
 * with its icon, the rest just words, and the one the remote is on lit white.
 *
 * Landing on a tab is choosing it — the page beneath changes as the remote moves along the row,
 * without a press — because that is how every other tab bar on the television behaves. Coming up
 * into the row lands on the tab showing rather than whichever is nearest, so moving up from the page
 * never changes it by accident.
 *
 * @param tabs - The parts there are, in order, each with the icon it shows while it is the one open.
 * @param current - The one showing.
 * @param onChoose - Told which part the remote moved to.
 * @param isStartingHere - Whether the remote starts on the current tab when the screen appears.
 * @param onFocusChange - Told when the remote comes onto a tab and when it leaves one.
 */
const TabBar = <Tab extends string>({
  tabs,
  current,
  onChoose,
  isStartingHere = false,
  onFocusChange,
}: TabBarProps<Tab>) => (
  <TVFocusGuideView autoFocus style={styles.bar}>
    {tabs.map((tab) => (
      <Focusable
        key={tab.id}
        label={tab.label}
        hasPreferredFocus={isStartingHere && tab.id === current}
        scale={1.06}
        onFocus={() => {
          onChoose(tab.id);
          onFocusChange?.(true);
        }}
        onBlur={() => {
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
            <View style={[styles.tab, isCurrent && styles.current, isFocused && styles.focused]}>
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
    ))}
  </TVFocusGuideView>
);

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
  current: { backgroundColor: 'rgba(255,255,255,0.16)' },
  focused: { backgroundColor: '#ffffff' },
  label: { fontSize: tokens.type.body - 2, fontWeight: '500' },
  labelCurrent: { fontWeight: '600' },
});

export { TabBar };
