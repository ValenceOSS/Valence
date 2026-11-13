import { useState } from 'react';
import { ChevronRight as ChevronRightIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import {
  WEBHOOK_EVENT_GROUPS,
  WEBHOOK_EVENT_LABELS,
  WEBHOOK_EVENT_NOTES,
} from '@ValenceContracts/schemas/Webhook';
import { cn } from '@ValenceUI/cn';
import type { WebhookSubscribableEvent } from '@ValenceContracts/schemas/Webhook';
import { say } from '@ValenceI18n/say';
import type { WebhookEventsCardProps } from './WebhookEventsCard.types';

const RECOVERIES: Partial<Record<WebhookSubscribableEvent, WebhookSubscribableEvent>> = {
  'job.stalled': 'job.working',
  'catalogue.unreachable': 'catalogue.reachable',
  'transcoder.unreachable': 'transcoder.reachable',
  'disk.low': 'disk.recovered',
  'requests.unreachable': 'requests.reachable',
  'requests.vpnDown': 'requests.vpnUp',
  'requests.indexerFailing': 'requests.indexerWorking',
};

const RECOVERY_EVENTS: readonly WebhookSubscribableEvent[] = Object.values(RECOVERIES);

const ROW_LABELS: Partial<Record<WebhookSubscribableEvent, string>> = {
  'job.stalled': say('screens.adminArea.webhookEventsCard.aJobKeepsFailing'),
  'catalogue.unreachable': say('screens.adminArea.webhookEventsCard.theCatalogueCantBeReached'),
  'transcoder.unreachable': say('screens.adminArea.webhookEventsCard.theTranscoderCantBeReached'),
  'disk.low': say('screens.adminArea.webhookEventsCard.diskSpaceRunsLow'),
  'requests.unreachable': say('screens.adminArea.webhookEventsCard.requestsCantBeReached'),
  'requests.vpnDown': say('screens.adminArea.webhookEventsCard.theVPNGoesDown'),
  'requests.indexerFailing': say('screens.adminArea.webhookEventsCard.anIndexerKeepsFailing'),
};

const RECOVERY_WORDS: Partial<Record<WebhookSubscribableEvent, string>> = {
  'job.stalled': say('screens.adminArea.webhookEventsCard.andWhenItWorksAgain'),
  'catalogue.unreachable': say('screens.adminArea.webhookEventsCard.andWhenItsBack'),
  'transcoder.unreachable': say('screens.adminArea.webhookEventsCard.andWhenItsBack'),
  'disk.low': say('screens.adminArea.webhookEventsCard.andWhenTheresRoomAgain'),
  'requests.unreachable': say('screens.adminArea.webhookEventsCard.andWhenItsBack'),
  'requests.vpnDown': say('screens.adminArea.webhookEventsCard.andWhenItsBackUp'),
  'requests.indexerFailing': say('screens.adminArea.webhookEventsCard.andWhenItWorksAgain'),
};

const PROBLEMS: readonly WebhookSubscribableEvent[] = [
  'job.failed',
  'job.stalled',
  'catalogue.unreachable',
  'transcoder.unreachable',
  'disk.low',
  'requests.unreachable',
  'requests.vpnDown',
  'requests.indexerFailing',
  'requests.downloadFailed',
  'auth.failed',
];

const REQUEST_UPDATES: readonly WebhookSubscribableEvent[] = [
  'requests.made',
  'requests.approved',
  'requests.refused',
  'requests.available',
];

type Preset = 'problems' | 'requests' | 'everything' | 'custom';

const isSame = (one: readonly string[], other: readonly string[]) =>
  one.length === other.length && one.every((event) => other.includes(event));

/**
 * Which events a webhook sends: a quick start for the usual choices, then every event in groups
 * that fold away, with each failure and its recovery as one row.
 *
 * @param events - What it sends.
 * @param offered - The events this server can send.
 * @param hasRequests - Whether requesting is on.
 * @param onChange - Saves a new set of events.
 */
const WebhookEventsCard = ({ events, offered, hasRequests, onChange }: WebhookEventsCardProps) => {
  const [alsoFixed, setAlsoFixed] = useState(
    events.some((event) => RECOVERY_EVENTS.includes(event)) ||
      !events.some((event) => RECOVERIES[event] !== undefined),
  );
  const shown = events.filter((event) => offered.includes(event));
  const groups = WEBHOOK_EVENT_GROUPS.filter((group) => hasRequests || group.id !== 'requests');
  const [opened, setOpened] = useState<string[]>(
    groups
      .filter((group) => group.events.some((event) => shown.includes(event)))
      .map((group) => group.id),
  );

  const withRecoveries = (chosen: readonly WebhookSubscribableEvent[], isFixedToo: boolean) => [
    ...chosen.filter((event) => !RECOVERY_EVENTS.includes(event)),
    ...(isFixedToo
      ? chosen.flatMap((event) => {
          const recovery = RECOVERIES[event];

          return recovery === undefined ? [] : [recovery];
        })
      : []),
  ];

  const presetSets: Record<Exclude<Preset, 'custom'>, WebhookSubscribableEvent[]> = {
    problems: withRecoveries(
      PROBLEMS.filter((event) => offered.includes(event)),
      alsoFixed,
    ),
    requests: withRecoveries(
      [...PROBLEMS, ...REQUEST_UPDATES].filter((event) => offered.includes(event)),
      alsoFixed,
    ),
    everything: withRecoveries(
      offered.filter((event) => !RECOVERY_EVENTS.includes(event)),
      alsoFixed,
    ),
  };

  const preset: Preset = isSame(shown, presetSets.problems)
    ? 'problems'
    : hasRequests && isSame(shown, presetSets.requests)
      ? 'requests'
      : isSame(shown, presetSets.everything)
        ? 'everything'
        : 'custom';

  const choose = (next: readonly WebhookSubscribableEvent[]) => {
    const settled = withRecoveries(next, alsoFixed);

    if (settled.length > 0) {
      onChange(settled);
    }
  };

  const rowsOf = (group: (typeof WEBHOOK_EVENT_GROUPS)[number]) =>
    group.events.filter((event) => !RECOVERY_EVENTS.includes(event));

  const total = groups.flatMap(rowsOf);
  const totalOn = total.filter((event) => shown.includes(event)).length;

  return (
    <PanelCard
      title={say('screens.adminArea.webhookEventsCard.whatItSends')}
      isFlush
      actions={
        <span className="pe-3 text-xs text-text-muted">
          {say('common.doneOfTotal', { done: totalOn, total: total.length })}
        </span>
      }
    >
      <div className="flex flex-col gap-3 border-b border-[var(--surface-line)] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedRow
            label={say('ui.siteFooter.quickStart')}
            size="sm"
            items={[
              { id: 'problems', label: say('screens.adminArea.webhookEventsCard.problemsOnly') },
              ...(hasRequests
                ? [
                    {
                      id: 'requests',
                      label: say('screens.adminArea.webhookEventsCard.problemsAndRequests'),
                    },
                  ]
                : []),
              { id: 'everything', label: say('common.everything') },
              { id: 'custom', label: say('screens.adminArea.addLibraryDialog.custom') },
            ]}
            value={preset}
            onSelect={(id) => {
              if (id === 'problems' || id === 'requests' || id === 'everything') {
                onChange(presetSets[id]);
                setOpened(
                  groups
                    .filter((group) => group.events.some((event) => presetSets[id].includes(event)))
                    .map((group) => group.id),
                );
              } else {
                setOpened(groups.map((group) => group.id));
              }
            }}
          />
          <span className="flex items-center gap-2 text-[0.8125rem] text-text">
            {say('screens.adminArea.webhookEventsCard.alsoSayWhenItsFixed')}
            <PanelCardInfo
              label={say('screens.adminArea.webhookEventsCard.aboutSayingWhenItsFixed')}
              detail={say('screens.adminArea.webhookEventsCard.sendsASecondMessageWhenSomething')}
              align="end"
            />
            <Switch
              label={say('screens.adminArea.webhookEventsCard.alsoSayWhenItsFixed')}
              isLabelHidden
              isOn={alsoFixed}
              onToggle={() => {
                setAlsoFixed(!alsoFixed);
                onChange(withRecoveries(shown, !alsoFixed));
              }}
            />
          </span>
        </div>
      </div>

      {groups.map((group, index) => {
        const rows = rowsOf(group);
        const onHere = rows.filter((event) => shown.includes(event)).length;
        const isOpen = opened.includes(group.id);
        const isEveryOne = onHere === rows.length;
        const half = Math.ceil(rows.length / 2);
        const columns = [rows.slice(0, half), rows.slice(half)];

        return (
          <div
            key={group.id}
            className={index === 0 ? '' : 'border-t border-[var(--surface-line)]'}
          >
            <div className="flex items-center justify-between gap-3 px-3">
              <Button
                variant="ghost"
                size="sm"
                aria-expanded={isOpen}
                className="my-1.5 text-text"
                onClick={() => {
                  setOpened((was) =>
                    isOpen ? was.filter((id) => id !== group.id) : [...was, group.id],
                  );
                }}
              >
                <Icon
                  of={ChevronRightIcon}
                  size={14}
                  className={cn(
                    'transition-transform duration-[var(--duration-fast)]',
                    isOpen ? 'rotate-90' : '',
                  )}
                />
                <span className="font-medium">{group.label}</span>
                <span className="text-text-muted">
                  {say('common.doneOfTotal', { done: onHere, total: rows.length })}
                </span>
              </Button>
              <Button
                variant="link"
                size="sm"
                className="h-auto px-2 text-xs text-text-muted"
                onClick={() => {
                  choose(
                    isEveryOne
                      ? shown.filter((event) => !group.events.includes(event))
                      : [...shown, ...rows.filter((event) => !shown.includes(event))],
                  );
                }}
              >
                {isEveryOne
                  ? say('screens.adminArea.webhookEventsCard.turnAllOff')
                  : say('screens.adminArea.alertsPanel.turnAllOn')}
              </Button>
            </div>

            {isOpen ? (
              <div className="grid gap-x-10 px-5 pb-1 xl:grid-cols-2">
                {columns.map((column, at) => (
                  <div key={at} className="flex flex-col divide-y divide-[var(--surface-line)]">
                    {column.map((event) => {
                      const recovery = RECOVERIES[event];
                      const label = ROW_LABELS[event] ?? WEBHOOK_EVENT_LABELS[event];
                      const note = WEBHOOK_EVENT_NOTES[event];

                      return (
                        <SettingRow
                          key={event}
                          title={label}
                          className="py-2.5"
                          {...(note === undefined
                            ? {}
                            : {
                                info: (
                                  <PanelCardInfo
                                    label={say('common.aboutName', { name: label })}
                                    detail={note}
                                    align="start"
                                  />
                                ),
                              })}
                          {...(recovery === undefined || !alsoFixed
                            ? {}
                            : { description: RECOVERY_WORDS[event] ?? '' })}
                        >
                          <Switch
                            label={label}
                            isLabelHidden
                            isOn={shown.includes(event)}
                            onToggle={() => {
                              choose(
                                shown.includes(event)
                                  ? shown.filter((one) => one !== event && one !== recovery)
                                  : [...shown, event],
                              );
                            }}
                          />
                        </SettingRow>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </PanelCard>
  );
};

WebhookEventsCard.displayName = 'WebhookEventsCard';

export { WebhookEventsCard };
