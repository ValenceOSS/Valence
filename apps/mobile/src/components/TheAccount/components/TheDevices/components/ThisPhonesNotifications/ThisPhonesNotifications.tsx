import { StyleSheet, View } from 'react-native';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { Toggle } from '@ValenceMobile/components/Toggle/Toggle';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useWakingThisPhone } from '@ValenceMobile/push/useWakingThisPhone';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  words: { flex: 1, gap: 2 },
});

/**
 * Whether this phone is told about requests that are ready, new arrivals and invitations, with the
 * switch that turns it on or off. Where the server's administrator has not turned phone
 * notifications on, it says so rather than offering a switch that could do nothing.
 */
const ThisPhonesNotifications = () => {
  const waking = useWakingThisPhone();

  return (
    <AGroup title={say('common.notifications')}>
      <View style={styles.row}>
        <View style={styles.words}>
          <Words>{say('phone.thisPhonesNotifications.notificationsOnThisPhone')}</Words>
          <Words size="small" tone="muted">
            {waking.isOffered
              ? say('phone.thisPhonesNotifications.whenARequestIsReadySomethingArrives')
              : say('phone.thisPhonesNotifications.yourServerHasNotTurnedThemOn')}
          </Words>
        </View>

        {waking.isOffered ? (
          <Toggle
            label={say('phone.thisPhonesNotifications.notificationsOnThisPhone')}
            isOn={waking.isOn}
            onToggle={(isOn) => {
              void (isOn ? waking.turnOn() : waking.turnOff());
            }}
          />
        ) : null}
      </View>
    </AGroup>
  );
};

ThisPhonesNotifications.displayName = 'ThisPhonesNotifications';

export { ThisPhonesNotifications };
