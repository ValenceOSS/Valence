import { StyleSheet, View } from 'react-native';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { ANoticeBlockProps } from './ANoticeBlock.types';

const styles = StyleSheet.create({
  notice: { borderRadius: 14, borderWidth: 1, gap: 4, padding: 14 },
});

/**
 * A plugin's notice: a boxed note in the colour of what it is about, its words shown as words.
 *
 * @param tone - Whether it informs, warns, reports a failure or reports success.
 * @param title - A line above it, where there is one.
 * @param text - What it says.
 */
const ANoticeBlock = ({ tone, title, text }: ANoticeBlockProps) => {
  const colours = useTheColours();
  const ink =
    tone === 'danger' ? colours.danger : tone === 'warning' ? colours.highlight : colours.accent;

  return (
    <View
      accessible
      accessibilityRole={tone === 'danger' || tone === 'warning' ? 'alert' : 'summary'}
      style={[
        styles.notice,
        { backgroundColor: withAlpha(ink, 0.1), borderColor: withAlpha(ink, 0.4) },
      ]}
    >
      {title === undefined ? null : <Words isStrong>{title}</Words>}
      <Words tone="muted">{text}</Words>
    </View>
  );
};

ANoticeBlock.displayName = 'ANoticeBlock';

export { ANoticeBlock };
