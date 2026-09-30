import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceTv/components/Button/Button';
import { QrCode } from '@ValenceTv/components/QrCode/QrCode';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ScanToConnectProps } from './ScanToConnect.types';
import { say } from '@ValenceI18n/say';

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
    <QrCode value={address} size={280} label={say('common.aCodeToScanWithYour')} />
    <View style={styles.steps}>
      <Text style={styles.title}>{say('tv.scanToConnect.connectOnYourPhone')}</Text>
      <Text style={styles.step}>{say('tv.scanToConnect.scanTheCodeWithYourPhones')}</Text>
      <Button label={say('common.done')} hasPreferredFocus onPress={onDone} />
    </View>
  </View>
);

ScanToConnect.displayName = 'ScanToConnect';

export { ScanToConnect };
