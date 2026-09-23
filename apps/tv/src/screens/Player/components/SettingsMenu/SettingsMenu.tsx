import { ScrollView, StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { ChevronRight } from '@keyline-icons/react-native';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { tokens } from '@ValenceTv/theme/tokens';
import type { SettingsMenuProps } from './SettingsMenu.types';

const WIDTH = 720;

/**
 * The player's settings, gathered in one panel down the right of the picture as the web's player
 * gathers them: each setting on its own row — the quality it is sent at, the sound, the subtitles,
 * how fast it plays — with what it is set to now on the right. Choosing a row opens its choices in
 * the same place; Menu closes the panel without changing anything.
 *
 * @param settings - The settings there are, each with what it is set to now.
 * @param onOpen - Told which setting was chosen, to show its choices.
 */
const SettingsMenu = ({ settings, onOpen }: SettingsMenuProps) => (
  <TVFocusGuideView style={styles.panel} trapFocusLeft trapFocusRight trapFocusUp trapFocusDown>
    <FadeIn>
      <Text style={styles.title}>Settings</Text>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {settings.map((setting, at) => (
          <Focusable
            key={setting.id}
            label={`${setting.label}, ${setting.value}`}
            scale={1}
            hasPreferredFocus={at === 0}
            onPress={() => {
              onOpen(setting.id);
            }}
          >
            {(isFocused) => {
              const ink = isFocused ? tokens.colours.onWhite : tokens.colours.text;
              const quiet = isFocused ? tokens.colours.onWhite : tokens.colours.muted;

              return (
                <View style={[styles.row, isFocused && styles.focused]}>
                  <Text style={[styles.label, { color: ink }]}>{setting.label}</Text>
                  <Text numberOfLines={1} style={[styles.value, { color: quiet }]}>
                    {setting.value}
                  </Text>
                  <Icon of={ChevronRight} size={26} colour={quiet} />
                </View>
              );
            }}
          </Focusable>
        ))}
      </ScrollView>
    </FadeIn>
  </TVFocusGuideView>
);

SettingsMenu.displayName = 'SettingsMenu';

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: WIDTH,
    paddingTop: tokens.space.xl,
    paddingHorizontal: tokens.space.lg,
    backgroundColor: 'rgba(12,12,12,0.92)',
  },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.heading,
    fontWeight: '700',
    marginBottom: tokens.space.md,
    paddingHorizontal: tokens.space.md,
  },
  list: { gap: tokens.space.xs, paddingBottom: tokens.space.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderRadius: tokens.radii.lg,
  },
  focused: { backgroundColor: '#ffffff' },
  label: { fontSize: tokens.type.body, fontWeight: '600' },
  value: { flex: 1, textAlign: 'right', fontSize: tokens.type.body },
});

export { SettingsMenu };
