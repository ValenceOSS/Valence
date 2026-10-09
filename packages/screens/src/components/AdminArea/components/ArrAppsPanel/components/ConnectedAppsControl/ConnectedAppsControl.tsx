import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { saveControlsConnectedApps } from '@ValenceClient/admin/fetchAdmin';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { failureOfAnswer } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { say } from '@ValenceI18n/say';

/**
 * Whether Valence works the connected apps libraries hand their requests to, from a title's page,
 * or leaves that to the apps themselves, with a switch that turns back where it could not be saved.
 */
const ConnectedAppsControl = () => {
  const cache = useQueryClient();
  const admin = useQuery(adminQueries.overview());
  const [isSaving, setIsSaving] = useState(false);
  const [shown, setShown] = useState<boolean | null>(null);
  const isOn = shown ?? admin.data?.settings.controlsConnectedApps ?? false;

  return (
    <SettingList isInset>
      <SettingRow
        title={say(
          'screens.adminArea.arrAppsPanel.connectedAppsControl.controlConnectedAppsFromValence',
        )}
        description={say(
          'screens.adminArea.arrAppsPanel.connectedAppsControl.letsYouSearchAConnectedApps',
        )}
      >
        <Switch
          label={say(
            'screens.adminArea.arrAppsPanel.connectedAppsControl.controlConnectedAppsFromValence',
          )}
          isLabelHidden
          isOn={isOn}
          disabled={admin.data === undefined || isSaving}
          onToggle={() => {
            const next = !isOn;

            setShown(next);
            setIsSaving(true);

            void saveControlsConnectedApps(next)
              .then((saved) => {
                tellOutcome(
                  say(
                    'screens.adminArea.arrAppsPanel.connectedAppsControl.connectedAppsSettingSaved',
                  ),
                  failureOfAnswer(
                    saved,
                    say(
                      'screens.adminArea.arrAppsPanel.connectedAppsControl.theConnectedAppsSettingCouldNot',
                    ),
                  ),
                );

                return saved
                  ? cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey })
                  : undefined;
              })
              .finally(() => {
                setShown(null);
                setIsSaving(false);
              });
          }}
        />
      </SettingRow>
    </SettingList>
  );
};

ConnectedAppsControl.displayName = 'ConnectedAppsControl';

export { ConnectedAppsControl };
