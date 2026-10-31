import { useState } from 'react';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { saveUsesPushRelay } from '@ValenceClient/admin/fetchAdmin';
import { failureOfAnswer } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { say } from '@ValenceI18n/say';
import type { PhoneNotificationsRowProps } from './PhoneNotificationsRow.types';

/**
 * Whether this server wakes its people's phones for notifications through Valence's push relay,
 * saying plainly what the relay is told and what it is not, since turning it on is this server
 * reaching outside itself.
 *
 * @param isOn - Whether the relay is turned on in the settings.
 */
const PhoneNotificationsRow = ({ isOn }: PhoneNotificationsRowProps) => {
  const [wakes, setWakes] = useState(isOn);

  return (
    <SettingRow
      title={say('screens.adminArea.phoneNotificationsRow.phoneNotifications')}
      description={say('screens.adminArea.phoneNotificationsRow.wakesTheValenceAppOnPhones')}
    >
      <Switch
        label={say('screens.adminArea.phoneNotificationsRow.phoneNotifications')}
        isLabelHidden
        isOn={wakes}
        onToggle={() => {
          const next = !wakes;

          setWakes(next);

          void saveUsesPushRelay(next).then((saved) => {
            tellOutcome(
              say('screens.adminArea.phoneNotificationsRow.phoneNotificationsSettingSaved'),
              failureOfAnswer(
                saved,
                say(
                  'screens.adminArea.phoneNotificationsRow.thePhoneNotificationsSettingCouldNotBe',
                ),
              ),
            );

            if (!saved) {
              setWakes(!next);
            }
          });
        }}
      />
    </SettingRow>
  );
};

PhoneNotificationsRow.displayName = 'PhoneNotificationsRow';

export { PhoneNotificationsRow };
