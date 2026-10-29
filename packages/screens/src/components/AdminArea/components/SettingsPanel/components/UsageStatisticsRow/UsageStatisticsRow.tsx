import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { saveTelemetryEnabled } from '@ValenceClient/admin/fetchAdmin';
import { failureOfAnswer } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { say } from '@ValenceI18n/say';
import { TelemetryPreviewDialog } from './components/TelemetryPreviewDialog/TelemetryPreviewDialog';
import type { UsageStatisticsRowProps } from './UsageStatisticsRow.types';

/**
 * Whether this server sends its one anonymous report a day, with the report itself a button away.
 * Where the environment forbids sending, the switch stays off and says so rather than offering a
 * choice that would change nothing.
 *
 * @param isOn - Whether sharing is turned on in the settings.
 * @param isOffByEnvironment - Whether the environment forbids sending whatever the settings say.
 */
const UsageStatisticsRow = ({ isOn, isOffByEnvironment }: UsageStatisticsRowProps) => {
  const [shares, setShares] = useState(isOn);
  const [isShowing, setIsShowing] = useState(false);

  return (
    <SettingRow
      title={say('common.shareAnonymousUsageStatistics')}
      description={
        isOffByEnvironment
          ? say('common.anonymousStatisticsAreTurnedOffByTheEnvironment')
          : say('common.onceADayValenceSendsAFewAnonymousCounts')
      }
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsShowing(true);
        }}
      >
        {say('screens.adminArea.usageStatisticsRow.seeWhatIsSent')}
      </Button>

      <Switch
        label={say('common.shareAnonymousUsageStatistics')}
        isLabelHidden
        isOn={shares && !isOffByEnvironment}
        disabled={isOffByEnvironment}
        onToggle={() => {
          const next = !shares;

          setShares(next);

          void saveTelemetryEnabled(next).then((saved) => {
            tellOutcome(
              say('screens.adminArea.usageStatisticsRow.usageStatisticsSettingSaved'),
              failureOfAnswer(
                saved,
                say('screens.adminArea.usageStatisticsRow.theUsageStatisticsSettingCouldNotBe'),
              ),
            );

            if (!saved) {
              setShares(!next);
            }
          });
        }}
      />

      <TelemetryPreviewDialog
        isOpen={isShowing}
        onClose={() => {
          setIsShowing(false);
        }}
      />
    </SettingRow>
  );
};

UsageStatisticsRow.displayName = 'UsageStatisticsRow';

export { UsageStatisticsRow };
