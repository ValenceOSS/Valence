import { StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import type { AReaderControlProps } from './AReaderControl.types';

const REACH = 44;

const styles = StyleSheet.create({
  reach: { alignItems: 'center', height: REACH, justifyContent: 'center', width: REACH },
});

/**
 * One control in the reader's top bar: an icon in the page's ink, with no circle of its own, since
 * the bar it sits in is the shape.
 *
 * @param label - What it does, for anybody who cannot see it.
 * @param onPress - Told it was pressed.
 * @param children - The icon.
 */
const AReaderControl = ({ label, onPress, children }: AReaderControlProps) => (
  <Button tone="bare" label={label} onPress={onPress}>
    <View style={styles.reach}>{children}</View>
  </Button>
);

AReaderControl.displayName = 'AReaderControl';

export { AReaderControl };
