import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { saveHiddenAlerts } from '@ValenceClient/admin/fetchAdmin';
import { ADMIN_ALERTS } from '@ValenceContracts/schemas/AdminAlert';
import type { AdminAlert } from '@ValenceContracts/schemas/AdminAlert';
import { failureOfAnswer } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { ALERT_TONES } from '@ValenceScreens/components/AdminArea/ALERT_TONES';
import { ConcernMark } from '@ValenceScreens/components/AdminArea/components/ConcernMark/ConcernMark';
import { say } from '@ValenceI18n/say';
import { ALERT_GROUPS } from './ALERT_GROUPS';
import type { AlertChoice } from './ALERT_GROUPS';

const REQUESTS_ALERTS: readonly AdminAlert[] = [
  'requests',
  'requests-vpn',
  'requests-solver',
  'requests-indexers',
];

/**
 * A switch for each alert the admin overview can show, saved for every administrator as it is
 * flipped, asking first before one about something broken is turned off.
 */
const AlertsPanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.overview());
  const requesting = useQuery(requestsQueries.availability());
  const [confirming, setConfirming] = useState<AlertChoice | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef(0);
  const title = say('screens.adminArea.adminSections.alerts');
  const saved = asked.data?.settings.hiddenAlerts;
  const hasRequests = requesting.data?.isEnabled ?? false;
  const overviewKey = adminQueries.overview().queryKey;

  if (saved === undefined) {
    return (
      <PanelCard title={title}>
        {asked.isError ? (
          <CouldNotRead
            said={say('screens.adminArea.alertsPanel.theAlertsCouldNotBeRead')}
            isTryingAgain={asked.isFetching}
            onTryAgain={() => {
              void asked.refetch();
            }}
          />
        ) : (
          <Spinner isCentered size="sm" label={say('common.loading')} />
        )}
      </PanelCard>
    );
  }

  const hiddenNow = ADMIN_ALERTS.filter((alert) => saved.includes(alert));
  const groups = ALERT_GROUPS.map((group) => ({
    ...group,
    alerts: group.alerts.filter((alert) => hasRequests || !REQUESTS_ALERTS.includes(alert.id)),
  })).filter((group) => group.alerts.length > 0);

  const save = (next: readonly AdminAlert[]) => {
    void cache.cancelQueries({ queryKey: overviewKey });
    cache.setQueryData(overviewKey, (was) =>
      was === undefined ? was : { ...was, settings: { ...was.settings, hiddenAlerts: [...next] } },
    );

    pending.current += 1;
    queue.current = queue.current
      .then(() => saveHiddenAlerts(next))
      .then((isSaved) => {
        tellOutcome(
          say('screens.adminArea.alertsPanel.alertsSaved'),
          failureOfAnswer(isSaved, say('screens.adminArea.alertsPanel.theAlertsCouldNotBeSaved')),
        );
      })
      .finally(() => {
        pending.current -= 1;

        if (pending.current === 0) {
          void cache.invalidateQueries({ queryKey: overviewKey });
        }
      });
  };

  const turn = (alert: AdminAlert, isOn: boolean) => {
    save(isOn ? hiddenNow.filter((one) => one !== alert) : [...hiddenNow, alert]);
  };

  return (
    <PanelCard
      title={title}
      isFlush
      actions={
        hiddenNow.length === 0 ? null : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              save([]);
            }}
          >
            {say('screens.adminArea.alertsPanel.turnAllOn')}
          </Button>
        )
      }
    >
      <p className="px-5 pb-1 pt-3 text-sm text-text-muted">
        {say('screens.adminArea.alertsPanel.choosesWhichAlertsShow')}
      </p>

      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-1 pt-3">
          <h3 className="px-5 text-xs font-medium text-text-muted">{group.title}</h3>

          <SettingList isInset>
            {group.alerts.map((alert) => {
              const isOn = !hiddenNow.includes(alert.id);

              return (
                <SettingRow
                  key={alert.id}
                  title={alert.title}
                  description={alert.description}
                  icon={<ConcernMark tone={ALERT_TONES[alert.id]} />}
                >
                  <Switch
                    label={alert.title}
                    isLabelHidden
                    isOn={isOn}
                    onToggle={() => {
                      if (isOn && ALERT_TONES[alert.id] === 'broken') {
                        setConfirming(alert);

                        return;
                      }

                      turn(alert.id, !isOn);
                    }}
                  />
                </SettingRow>
              );
            })}
          </SettingList>
        </section>
      ))}

      <ConfirmDialog
        title={say('screens.adminArea.alertsPanel.turnOffThisAlert')}
        detail={
          confirming === null
            ? ''
            : say('screens.adminArea.alertsPanel.titleShowsWhenSomethingIsBroken', {
                title: confirming.title,
              })
        }
        confirmLabel={say('common.turnOff')}
        isDestructive
        isOpen={confirming !== null}
        onClose={() => {
          setConfirming(null);
        }}
        onConfirm={() => {
          if (confirming !== null) {
            turn(confirming.id, false);
          }

          setConfirming(null);
        }}
      />
    </PanelCard>
  );
};

AlertsPanel.displayName = 'AlertsPanel';

export { AlertsPanel };
