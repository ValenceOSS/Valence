import { StyleSheet, View } from 'react-native';
import type { ACardPartProps } from './ACardPart.types';

const styles = StyleSheet.create({
  part: { marginTop: 12 },
});

/**
 * One headed part of a card further down it — the ratings, the details, the cast — set further from
 * the part above than its heading is from what it heads, so each heading plainly belongs to what
 * follows it.
 *
 * @param children - The part, heading and all.
 */
const ACardPart = ({ children }: ACardPartProps) => <View style={styles.part}>{children}</View>;

ACardPart.displayName = 'ACardPart';

export { ACardPart };
