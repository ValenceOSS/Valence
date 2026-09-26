import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { endDevice, endOtherDevices, fetchDevices } from '@ValenceClient/account/fetchDevices';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { SignInATelevision } from '@ValenceMobile/components/TheAccount/components/TheDevices/components/SignInATelevision/SignInATelevision';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';

const DEVICES = ['account', 'devices'] as const;

const styles = StyleSheet.create({
  device: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  words: { flex: 1, gap: 2 },
});

/**
 * A television to sign in from here, everywhere this account is signed in, and a way to end any of
 * it but this phone.
 *
 * Ending one is asked about first, because the person on the other end is thrown out mid-film.
 */
const TheDevices = () => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const devices = useQuery({ queryKey: DEVICES, queryFn: fetchDevices });
  const elsewhere = (devices.data ?? []).filter((device) => !device.isCurrent);

  const reread = () => cache.invalidateQueries({ queryKey: DEVICES });

  const end = (deviceId: string, name: string) => {
    Alert.alert(`Sign out ${name}?`, 'Whoever is using it will have to sign in again.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void endDevice(deviceId).then(reread);
        },
      },
    ]);
  };

  const endTheRest = () => {
    Alert.alert('Sign out everywhere else?', 'Every other device will have to sign in again.', [
      { text: 'Keep them', style: 'cancel' },
      {
        text: 'Sign them out',
        style: 'destructive',
        onPress: () => {
          void endOtherDevices().then(reread);
        },
      },
    ]);
  };

  if (devices.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  if (devices.isError) {
    return <Words tone="danger">Those could not be read.</Words>;
  }

  return (
    <>
      <SignInATelevision />

      <AGroup title="Devices">
        {devices.data.map((device) => (
          <View key={device.id} style={styles.device}>
            <View style={styles.words}>
              <Words>{device.isCurrent ? `${device.name} · This phone` : device.name}</Words>
              <Words size="small" tone="muted">
                {[device.address, `Signed in ${saidWhen(device.signedInAt)}`]
                  .filter((part) => part !== null)
                  .join(' · ')}
              </Words>
            </View>

            {device.isCurrent ? null : (
              <Button
                tone="quiet"
                label={`Sign out ${device.name}`}
                onPress={() => {
                  end(device.id, device.name);
                }}
              >
                Sign out
              </Button>
            )}
          </View>
        ))}

        {elsewhere.length === 0 ? null : (
          <Button tone="quiet" onPress={endTheRest}>
            Sign out everywhere else
          </Button>
        )}
      </AGroup>
    </>
  );
};

TheDevices.displayName = 'TheDevices';

export { TheDevices };
