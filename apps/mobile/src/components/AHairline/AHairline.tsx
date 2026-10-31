import { StyleSheet, View } from 'react-native';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';

const styles = StyleSheet.create({
  line: { alignSelf: 'stretch', height: StyleSheet.hairlineWidth },
});

/**
 * A hairline across a card between what it is and what is said about it, faint in the page's ink so
 * it sits on any tint.
 */
const AHairline = () => {
  const colours = useTheColours();

  return <View style={[styles.line, { backgroundColor: withAlpha(colours.text, 0.14) }]} />;
};

AHairline.displayName = 'AHairline';

export { AHairline };
