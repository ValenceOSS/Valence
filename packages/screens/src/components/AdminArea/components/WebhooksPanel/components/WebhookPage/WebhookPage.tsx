import { useRef } from 'react';
import { Bin as BinFilledIcon, Send as SendFilledIcon } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { MultiSelectField } from '@ValenceUI/MultiSelectField';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SelectField } from '@ValenceUI/SelectField';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import {
  WEBHOOK_EVENT_GROUPS,
  WEBHOOK_EVENT_LABELS,
  WEBHOOK_PRESETS,
  isSubscribableEvent,
} from '@ValenceContracts/schemas/Webhook';
import { MEDIA_KINDS, MEDIA_KIND_LABELS } from '@ValenceContracts/schemas/MediaKind';
import { CustomHeadersCard } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/components/CustomHeadersCard/CustomHeadersCard';
import { CustomMessageCard } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/components/CustomMessageCard/CustomMessageCard';
import { CustomRequestRows } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/components/CustomRequestRows/CustomRequestRows';
import { DEFAULT_CUSTOM_WEBHOOK } from '@ValenceContracts/constants/DEFAULT_CUSTOM_WEBHOOK';
import { WEBHOOK_SERVICE_NAMES } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/WEBHOOK_SERVICE_NAMES';
import { lastDeliveryOf } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/lastDeliveryOf';
import { webhookAddressProblem } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/webhookAddressProblem';
import { webhookNameProblem } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/webhookNameProblem';
import { SavedText } from '@ValenceScreens/components/AdminArea/components/SavedText/SavedText';
import { WebhookEventsCard } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/components/WebhookEventsCard/WebhookEventsCard';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import { say } from '@ValenceI18n/say';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type {
  CustomWebhook,
  WebhookDelivery,
  WebhookSubscribableEvent,
} from '@ValenceContracts/schemas/Webhook';
import type { WebhookChange } from '@ValenceClient/admin/fetchWebhooks';
import type { WebhookPageProps } from './WebhookPage.types';

const SERVICE_CHOICES = WEBHOOK_PRESETS.map((preset) => ({
  id: preset,
  label:
    preset === 'generic'
      ? say('screens.adminArea.webhookPage.valenceJSON')
      : WEBHOOK_SERVICE_NAMES[preset],
}));

const KIND_CHOICES = MEDIA_KINDS.map((kind) => ({ id: kind, label: MEDIA_KIND_LABELS[kind] }));

/**
 * One webhook on a page of its own: where it posts, which events it sends and about whom, and every
 * delivery it has made, with the test and on/off controls beside them so a change can be tried at
 * once. Every setting saves as it is changed.
 *
 * @param webhook - The webhook.
 * @param created - The secret of a webhook just made, shown once.
 * @param deliveries - What it has sent lately.
 * @param isHistoryLoading - Whether that is still being read.
 * @param accounts - The accounts it can be narrowed to.
 * @param profiles - The profiles it can be narrowed to.
 * @param hasRequests - Whether requesting is on.
 * @param onBack - Goes back to the list.
 * @param onEdit - Saves a change.
 * @param onSetEnabled - Turns it on or off.
 * @param onTest - Sends a test.
 * @param onDelete - Asks to delete it.
 * @param onRedeliver - Sends a delivery again.
 * @param onDismissCreated - Takes the secret down.
 */
const WebhookPage = ({
  webhook,
  created,
  deliveries,
  isHistoryLoading,
  accounts,
  profiles,
  hasRequests,
  onBack,
  onEdit,
  onSetEnabled,
  onTest,
  onDelete,
  onRedeliver,
  onDismissCreated,
}: WebhookPageProps) => {
  const now = useTicking(A_CAPTION_AGES_EVERY);
  const isCustom = webhook.preset === 'custom';
  const setup = webhook.custom ?? DEFAULT_CUSTOM_WEBHOOK;
  const sending = useRef<CustomWebhook | null>(null);
  const events = webhook.events.filter(isSubscribableEvent);
  const last = lastDeliveryOf(webhook);
  const offered: readonly WebhookSubscribableEvent[] = WEBHOOK_EVENT_GROUPS.filter(
    (group) => hasRequests || group.id !== 'requests',
  ).flatMap((group) => group.events);

  const save = async (change: WebhookChange) => (await onEdit(webhook.id, change)) === null;

  const saveCustom = async (change: Partial<CustomWebhook>) => {
    const next = { ...(sending.current ?? setup), ...change };

    sending.current = next;

    const isSaved = await save({ custom: next });

    if (sending.current === next) {
      sending.current = null;
    }

    return isSaved;
  };

  const setEvents = (next: WebhookSubscribableEvent[]) => {
    if (next.length > 0) {
      void save({ events: next });
    }
  };

  const deliveryColumns: DataTableColumn<WebhookDelivery>[] = [
    {
      id: 'status',
      header: say('common.status'),
      accessorFn: (delivery) => (delivery.ok ? 1 : 0),
      cell: ({ row }) =>
        row.original.ok ? (
          <Badge tone="success">{say('screens.webhooksPanel.deliveryHistory.delivered')}</Badge>
        ) : (
          <Badge tone="danger">{say('common.failed')}</Badge>
        ),
    },
    {
      id: 'event',
      header: say('screens.adminArea.webhookPage.event'),
      accessorFn: (delivery) => WEBHOOK_EVENT_LABELS[delivery.event],
      cell: ({ row }) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-text">{WEBHOOK_EVENT_LABELS[row.original.event]}</span>
          {row.original.error === null ? null : (
            <span className="line-clamp-2 text-xs text-danger" title={row.original.error}>
              {row.original.error}
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'tries',
      header: say('screens.adminArea.webhookPage.tries'),
      accessorFn: (delivery) => delivery.attempts,
      cell: ({ row }) => (
        <span className="tabular-nums text-text-muted">{row.original.attempts}</span>
      ),
    },
    {
      id: 'when',
      header: say('screens.observabilityPage.jobHistory.when'),
      accessorFn: (delivery) => delivery.lastAttemptAt,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-muted">
          {describeSince(row.original.lastAttemptAt, now)}
        </span>
      ),
    },
    {
      id: 'act',
      header: '',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.ok ? null : (
          <Button
            variant="secondary"
            size="sm"
            disabled={!webhook.enabled}
            onClick={() => {
              onRedeliver(row.original.id);
            }}
          >
            {say('screens.webhooksPanel.deliveryHistory.sendAgain')}
          </Button>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PanelCard
        title={webhook.name}
        actions={
          <Button variant="ghost" size="sm" onClick={onBack}>
            {say('screens.adminArea.webhookPage.backToWebhooks')}
          </Button>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="flex flex-wrap items-center gap-2">
              <Badge>{WEBHOOK_SERVICE_NAMES[webhook.preset]}</Badge>
              <Badge tone={last.tone}>{last.label}</Badge>
              {webhook.lastAttemptAt === null ? null : (
                <span className="text-xs text-text-muted">
                  {describeSince(webhook.lastAttemptAt, now)}
                </span>
              )}
            </span>
            <span className="break-all text-xs text-text-muted">{webhook.url}</span>
            {webhook.lastError === null ? null : (
              <span className="text-xs text-danger">{webhook.lastError}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              label={say('common.enabled')}
              isOn={webhook.enabled}
              onToggle={() => {
                onSetEnabled(!webhook.enabled);
              }}
            />
            <Button variant="secondary" size="sm" disabled={!webhook.enabled} onClick={onTest}>
              <Icon of={SendFilledIcon} size={14} />
              {say('screens.adminArea.webhooksPanel.sendATest')}
            </Button>
            <ActionMenu
              label={say('common.actionsForName', { name: webhook.name })}
              groups={[
                {
                  items: [
                    {
                      id: 'delete',
                      label: say('common.delete'),
                      icon: <Icon of={BinFilledIcon} size={15} />,
                      isDestructive: true,
                      onChoose: onDelete,
                    },
                  ],
                },
              ]}
            />
          </div>
        </div>
      </PanelCard>

      {created === null ? null : (
        <PanelCard title={say('screens.adminArea.webhooksPanel.newWebhook')} isHighlighted>
          <div className="flex flex-col gap-3">
            <span className="text-xs text-text-muted">
              {say('screens.adminArea.webhooksPanel.thisIsTheOnlyTimeIt')}
            </span>
            <code className="select-all break-all rounded-lg bg-[var(--surface-hover)] px-3 py-2 font-mono text-xs text-text">
              {created.secret}
            </code>
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={onDismissCreated}>
                {say('screens.adminArea.webhooksPanel.iHaveCopiedIt')}
              </Button>
            </div>
          </div>
        </PanelCard>
      )}

      <PanelCard title={say('screens.adminArea.webhookPage.whereItGoes')} isFlush>
        <SettingList isInset>
          <SettingRow
            title={say('common.name')}
            description={say('screens.adminArea.webhookPage.whatItsCalledOnThisPage')}
          >
            <SavedText
              label={say('common.name')}
              saved={webhook.name}
              problemOf={webhookNameProblem}
              onSave={(name) => save({ name })}
            />
          </SettingRow>
          <SettingRow
            title={say('screens.adminArea.bucketDialog.service')}
            description={say('screens.adminArea.webhookPage.shapesEachMessageForWhereIts')}
          >
            <SelectField
              label={say('screens.adminArea.bucketDialog.service')}
              isLabelHidden
              size="sm"
              className="w-96 max-w-full"
              options={SERVICE_CHOICES}
              value={webhook.preset}
              onSelect={(id) => {
                const preset = WEBHOOK_PRESETS.find((one) => one === id);

                if (preset === undefined || preset === webhook.preset) {
                  return;
                }

                void save(
                  preset === 'custom' && webhook.custom === null
                    ? { preset, custom: DEFAULT_CUSTOM_WEBHOOK }
                    : { preset },
                );
              }}
            />
          </SettingRow>
          <SettingRow
            title={say('common.address')}
            description={say('screens.adminArea.webhookPage.whereEachMessageIsPosted')}
          >
            <SavedText
              label={say('common.address')}
              type="url"
              saved={webhook.url}
              problemOf={webhookAddressProblem}
              onSave={(url) => save({ url })}
            />
          </SettingRow>
          <SettingRow
            title={say('screens.adminArea.webhooksPanel.localNetwork')}
            description={say('screens.adminArea.webhooksPanel.localNetworkDescription')}
          >
            <Switch
              label={say('screens.adminArea.webhooksPanel.localNetwork')}
              isLabelHidden
              isOn={webhook.reachesLocalNetwork}
              onToggle={() => {
                void save({ reachesLocalNetwork: !webhook.reachesLocalNetwork });
              }}
            />
          </SettingRow>
          {isCustom ? (
            <CustomRequestRows
              setup={setup}
              onChange={(next) => {
                void saveCustom(next);
              }}
            />
          ) : null}
        </SettingList>
      </PanelCard>

      {isCustom ? (
        <>
          <CustomHeadersCard saved={setup.headers} onSave={(headers) => saveCustom({ headers })} />
          <CustomMessageCard
            setup={setup}
            subscribed={events}
            url={webhook.url}
            onSave={(template) => saveCustom({ template })}
          />
        </>
      ) : null}

      <WebhookEventsCard
        events={events}
        offered={offered}
        hasRequests={hasRequests}
        onChange={setEvents}
      />

      <PanelCard title={say('screens.adminArea.webhookPage.onlyFor')} isFlush>
        <SettingList isInset>
          <SettingRow
            title={say('common.accounts')}
            description={say('screens.adminArea.webhookPage.whoseSignInsAndAccountChanges')}
          >
            <MultiSelectField
              label={say('common.accounts')}
              isLabelHidden
              size="sm"
              className="w-56 max-w-full"
              placeholder={say('common.everyone')}
              options={accounts}
              value={webhook.filters.accounts}
              onChange={(chosen) => {
                void save({ filters: { ...webhook.filters, accounts: chosen } });
              }}
            />
          </SettingRow>
          <SettingRow
            title={say('common.profiles')}
            description={say('screens.adminArea.webhookPage.whoseWatchingIsSent')}
          >
            <MultiSelectField
              label={say('common.profiles')}
              isLabelHidden
              size="sm"
              className="w-56 max-w-full"
              placeholder={say('common.everyone')}
              options={profiles}
              value={webhook.filters.profiles}
              onChange={(chosen) => {
                void save({ filters: { ...webhook.filters, profiles: chosen } });
              }}
            />
          </SettingRow>
          <SettingRow
            title={say('screens.adminArea.webhookFields.kinds')}
            description={say('screens.adminArea.webhookPage.whichKindsOfTitleAreSent')}
          >
            <MultiSelectField
              label={say('screens.adminArea.webhookFields.kinds')}
              isLabelHidden
              size="sm"
              className="w-56 max-w-full"
              placeholder={say('screens.adminArea.webhookPage.everyKind')}
              options={KIND_CHOICES}
              value={webhook.filters.itemTypes}
              onChange={(chosen) => {
                void save({
                  filters: {
                    ...webhook.filters,
                    itemTypes: MEDIA_KINDS.filter((kind) => chosen.includes(kind)),
                  },
                });
              }}
            />
          </SettingRow>
          <SettingRow
            title={say('screens.adminArea.webhookFields.whenThingsArrive')}
            description={say('screens.adminArea.webhookFields.aFirstScanOfALarge')}
          >
            <SelectField
              label={say('screens.adminArea.webhookFields.whenThingsArrive')}
              isLabelHidden
              size="sm"
              className="w-56 max-w-full"
              options={[
                { id: 'perScan', label: say('screens.adminArea.webhookFields.oncePerScan') },
                { id: 'perItem', label: say('screens.adminArea.webhookFields.oneForEachThing') },
              ]}
              value={webhook.filters.mediaAdded}
              onSelect={(id) => {
                void save({
                  filters: {
                    ...webhook.filters,
                    mediaAdded: id === 'perItem' ? 'perItem' : 'perScan',
                  },
                });
              }}
            />
          </SettingRow>
        </SettingList>
      </PanelCard>

      <PanelCard title={say('screens.adminArea.webhookPage.deliveries')} isFlush>
        {isHistoryLoading ? (
          <Spinner
            isCentered
            size="sm"
            label={say('screens.webhooksPanel.deliveryHistory.readingWhatHasBeenSent')}
          />
        ) : (
          <DataTable
            label={say('screens.adminArea.webhookPage.deliveries')}
            columns={deliveryColumns}
            rows={deliveries}
            getRowId={(delivery) => delivery.id}
            pageSize={10}
            emptyMessage={say('screens.webhooksPanel.deliveryHistory.nothingHasBeenSentToThis')}
          />
        )}
      </PanelCard>
    </div>
  );
};

WebhookPage.displayName = 'WebhookPage';

export { WebhookPage };
