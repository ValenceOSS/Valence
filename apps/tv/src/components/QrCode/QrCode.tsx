import { StyleSheet, View } from 'react-native';
import { encode } from 'uqr';
import type { QrCodeProps } from './QrCode.types';

const QUIET_MODULES = 2;

/**
 * An address as a QR code, drawn square by square, for a phone's camera to read off the television.
 *
 * Drawn from plain views rather than an image or a vector, because the matrix is small and a view
 * per square is all a camera needs: black on a white field with the quiet border readers expect.
 *
 * @param value - What the code says, usually an address.
 * @param size - How wide it is drawn.
 * @param label - What it is, for VoiceOver.
 */
const QrCode = ({ value, size, label }: QrCodeProps) => {
  const { data } = encode(value, { ecc: 'M', border: QUIET_MODULES });
  const module = size / (data.length || 1);

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.field, { width: size, height: size }]}
    >
      {data.map((row, y) => (
        <View key={y} style={styles.row}>
          {row.map((isDark, x) => (
            <View
              key={x}
              style={{ width: module, height: module, backgroundColor: isDark ? '#000' : '#fff' }}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

QrCode.displayName = 'QrCode';

const styles = StyleSheet.create({
  field: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row' },
});

export { QrCode };
