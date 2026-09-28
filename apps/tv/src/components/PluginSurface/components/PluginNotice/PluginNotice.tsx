import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import { withAlpha } from '@ValenceTv/theme/withAlpha';
import type { PluginNoticeProps } from './PluginNotice.types';

const styles = StyleSheet.create({
  notice: {
    borderRadius: tokens.radii.lg,
    borderWidth: 2,
    gap: tokens.space.xs,
    padding: tokens.space.md,
  },
  text: { color: tokens.colours.muted, fontSize: tokens.type.body },
  title: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '600' },
});

/**
 * A plugin's notice on the television: a boxed note in the colour of what it is about, its words
 * shown as words.
 *
 * @param tone - Whether it informs, warns, reports a failure or reports success.
 * @param title - A line above it, where there is one.
 * @param text - What it says.
 */
const PluginNotice = ({ tone, title, text }: PluginNoticeProps) => {
  const ink =
    tone === 'danger'
      ? tokens.colours.danger
      : tone === 'success'
        ? tokens.colours.success
        : tokens.colours.accent;

  return (
    <View
      accessible
      accessibilityRole={tone === 'danger' || tone === 'warning' ? 'alert' : 'summary'}
      style={[
        styles.notice,
        { backgroundColor: withAlpha(ink, 0.12), borderColor: withAlpha(ink, 0.4) },
      ]}
    >
      {title === undefined ? null : <Text style={styles.title}>{title}</Text>}
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

PluginNotice.displayName = 'PluginNotice';

export { PluginNotice };
