import { Alert, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { endDevice, endOtherDevices, fetchDevices } from '@ValenceClient/account/fetchDevices';
import type { Device } from '@ValenceClient/account/fetchDevices';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { Button } from '@ValenceTv/components/Button/Button';
import { tokens } from '@ValenceTv/theme/tokens';
import type { YourDevicesProps } from './YourDevices.types';
import { say } from '@ValenceI18n/say';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';

const DEVICES = ['account', 'devices'] as const;

/**
 * Says where a device is and when it signed in, as one line beneath its name.
 *
 * @param device - The device.
 */
const detailOf = (device: Device): string => {
  const signedIn = saidWhen(device.signedInAt);

  return [
    device.address,
    signedIn === null ? null : say('common.signedInWhen', { signedInAt: signedIn }),
  ]
    .filter((part) => part !== null)
    .join(' · ');
};

/**
 * Everywhere this account is signed in, on its account page, so somebody can see a session they do
 * not recognise from the sofa and end it. This television is named as this one and cannot be ended
 * from here, since signing out is the button above. Ending another, or every other, is asked about
 * first, because whoever is on the other end is thrown out mid-film, and one that did not go through
 * says so rather than leaving the device listed as if nothing had been tried. The list catches the remote
 * across the whole width of the page. A shared demo account ends nothing, and the server lists it
 * no device but this one.
 *
 * @param onFocus - Told when the remote comes onto the list.
 */
const YourDevices = ({ onFocus }: YourDevicesProps) => {
  const cache = useQueryClient();
  const devices = useQuery({ queryKey: DEVICES, queryFn: fetchDevices });
  const { isDemo } = useWhatIMayDo();

  if (devices.data === undefined) {
    return null;
  }

  const here = devices.data.find((device) => device.isCurrent);
  const elsewhere = devices.data.filter((device) => !device.isCurrent);

  const reread = () => cache.invalidateQueries({ queryKey: DEVICES });

  const end = (device: Device) => {
    const name = sayAgain(device.name);

    Alert.alert(
      say('common.signOutNamedAsk', { name }),
      say('common.whoeverIsUsingItWillHaveToSignIn'),
      [
        { text: say('common.keepIt'), style: 'cancel' },
        {
          text: say('common.signOut'),
          style: 'destructive',
          onPress: () => {
            void endDevice(device.id).then((isEnded) => {
              if (!isEnded) {
                Alert.alert(say('tv.account.yourDevices.nameCouldNotBeSignedOut', { name }));

                return;
              }

              void reread();
            });
          },
        },
      ],
    );
  };

  const endTheRest = () => {
    Alert.alert(
      say('common.signOutEverywhereElse2'),
      say('common.everyOtherDeviceWillHaveToSignIn'),
      [
        { text: say('common.keepThem'), style: 'cancel' },
        {
          text: say('common.signThemOut'),
          style: 'destructive',
          onPress: () => {
            void endOtherDevices().then((isEnded) => {
              if (!isEnded) {
                Alert.alert(say('tv.account.yourDevices.theOtherDevicesCouldNotBeSignedOut'));

                return;
              }

              void reread();
            });
          },
        },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{say('common.devices')}</Text>

      {here === undefined ? null : (
        <View style={styles.here}>
          <Text style={styles.name}>
            {say('tv.account.yourDevices.nameThisTelevision', { name: sayAgain(here.name) })}
          </Text>
          <Text style={styles.detail}>{detailOf(here)}</Text>
        </View>
      )}

      {elsewhere.length === 0 || isDemo ? (
        <Text style={styles.detail}>{say('tv.account.yourDevices.noOtherDevices')}</Text>
      ) : (
        <FocusGuide isRemembering style={styles.list}>
          {elsewhere.map((device) => (
            <Button
              key={device.id}
              label={say('common.signOutNamed', { name: sayAgain(device.name) })}
              detail={detailOf(device)}
              variant="secondary"
              isWide
              onFocus={onFocus}
              onPress={() => {
                end(device);
              }}
            />
          ))}

          <Button
            label={say('common.signOutEverywhereElse')}
            variant="ghost"
            onFocus={onFocus}
            onPress={endTheRest}
          />
        </FocusGuide>
      )}
    </View>
  );
};

YourDevices.displayName = 'YourDevices';

const styles = StyleSheet.create({
  section: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: tokens.space.xs,
    marginTop: tokens.space.lg,
  },
  heading: {
    alignSelf: 'stretch',
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingHorizontal: tokens.space.edge,
  },
  here: { width: 760, gap: 2, paddingVertical: tokens.space.sm },
  name: { color: tokens.colours.text, fontSize: tokens.type.body },
  detail: { color: tokens.colours.muted, fontSize: tokens.type.small },
  list: { width: 760, gap: tokens.space.md, alignItems: 'center' },
});

export { YourDevices };
