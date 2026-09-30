import { sayAgain } from '@ValenceI18n/sayAgain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { endDevice, endOtherDevices, fetchDevices } from '@ValenceClient/account/fetchDevices';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { SignInATelevision } from '@ValenceMobile/components/TheAccount/components/TheDevices/components/SignInATelevision/SignInATelevision';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { say } from '@ValenceI18n/say';

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
    Alert.alert(
      say('phone.theAccount.theDevices.signOutName2', { name }),
      say('phone.theAccount.theDevices.whoeverIsUsingItWillHave'),
      [
        { text: say('common.keepIt'), style: 'cancel' },
        {
          text: say('common.signOut'),
          style: 'destructive',
          onPress: () => {
            void endDevice(deviceId).then(reread);
          },
        },
      ],
    );
  };

  const endTheRest = () => {
    Alert.alert(
      say('common.signOutEverywhereElse2'),
      say('phone.theAccount.theDevices.everyOtherDeviceWillHaveTo'),
      [
        { text: say('common.keepThem'), style: 'cancel' },
        {
          text: say('common.signThemOut'),
          style: 'destructive',
          onPress: () => {
            void endOtherDevices().then(reread);
          },
        },
      ],
    );
  };

  if (devices.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  if (devices.isError) {
    return <Words tone="danger">{say('common.thoseCouldNotBeRead')}</Words>;
  }

  return (
    <>
      <SignInATelevision />

      <AGroup title={say('common.devices')}>
        {devices.data.map((device) => (
          <View key={device.id} style={styles.device}>
            <View style={styles.words}>
              <Words>
                {device.isCurrent
                  ? say('phone.theAccount.theDevices.nameThisPhone', {
                      name: sayAgain(device.name),
                    })
                  : sayAgain(device.name)}
              </Words>
              <Words size="small" tone="muted">
                {[
                  device.address,
                  say('phone.theAccount.theDevices.signedInSignedInAt', {
                    signedInAt: saidWhen(device.signedInAt),
                  }),
                ]
                  .filter((part) => part !== null)
                  .join(' · ')}
              </Words>
            </View>

            {device.isCurrent ? null : (
              <Button
                tone="quiet"
                label={say('phone.theAccount.theDevices.signOutName', {
                  name: sayAgain(device.name),
                })}
                onPress={() => {
                  end(device.id, sayAgain(device.name));
                }}
              >
                {say('common.signOut')}
              </Button>
            )}
          </View>
        ))}

        {elsewhere.length === 0 ? null : (
          <Button tone="ghost" isWide isDestructive onPress={endTheRest}>
            {say('common.signOutEverywhereElse')}
          </Button>
        )}
      </AGroup>
    </>
  );
};

TheDevices.displayName = 'TheDevices';

export { TheDevices };
