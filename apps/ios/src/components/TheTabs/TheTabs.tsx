import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheTabsProps } from './TheTabs.types';

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingTop: 8 },
  tab: { alignItems: 'center', gap: 3, paddingVertical: 2 },
  wide: { flex: 1 },
});

/**
 * The row along the bottom that moves between the parts of the app.
 *
 * @param tabs - The parts there are.
 * @param value - Which one is showing.
 * @param onSelect - Told which one somebody pressed.
 */
const TheTabs = ({ tabs, value, onSelect }: TheTabsProps) => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();

  return (
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
          <View key={tab.id} style={styles.wide}>
            <Button
              tone="bare"
              label={tab.label}
              isChosen={isShowing}
              onPress={() => {
                onSelect(tab.id);
              }}
            >
              <View style={styles.tab}>
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
      })}
    </View>
  );
};

TheTabs.displayName = 'TheTabs';

export { TheTabs };
