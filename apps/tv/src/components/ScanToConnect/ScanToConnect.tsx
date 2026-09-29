import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceTv/components/Button/Button';
import { QrCode } from '@ValenceTv/components/QrCode/QrCode';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ScanToConnectProps } from './ScanToConnect.types';

const styles = StyleSheet.create({
  handoff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.xl,
    padding: tokens.space.lg,
    borderRadius: tokens.radii.lg,
    backgroundColor: tokens.colours.raised,
  },
  steps: { flex: 1, gap: tokens.space.sm, alignItems: 'flex-start' },
  title: { color: tokens.colours.text, fontSize: tokens.type.heading, fontWeight: '700' },
  step: { color: tokens.colours.muted, fontSize: tokens.type.body },
});

/**
 * An account being connected from the television, finished on a phone: a code to scan that opens
 * the account's own sign-in page there, and a way to say it is done.
 *
 * @param address - The page to open on the phone.
 * @param onDone - Told somebody has finished, or given up.
 */
const ScanToConnect = ({ address, onDone }: ScanToConnectProps) => (
  <View style={styles.handoff}>
    <QrCode value={address} size={280} label="A code to scan with your phone's camera" />
    <View style={styles.steps}>
      <Text style={styles.title}>Connect on your phone</Text>
      <Text style={styles.step}>
        Scan the code with your phone's camera and sign in there. The code works once and runs out
        after a few minutes.
      </Text>
      <Button label="Done" hasPreferredFocus onPress={onDone} />
    </View>
  </View>
);

ScanToConnect.displayName = 'ScanToConnect';

export { ScanToConnect };
