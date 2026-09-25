import { useId } from 'react';
import { Button } from '@ValenceUI/Button';
import { FormField } from '@ValenceUI/FormField';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Switch } from '@ValenceUI/Switch';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TextField } from '@ValenceUI/TextField';
import {
  WEBHOOK_EVENT_GROUPS,
  WEBHOOK_EVENT_LABELS,
  WEBHOOK_EVENT_NOTES,
  WEBHOOK_PRESETS,
} from '@ValenceContracts/schemas/Webhook';
import { MEDIA_KINDS, MEDIA_KIND_LABELS } from '@ValenceContracts/schemas/MediaKind';
import { WebhookFilterList } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/components/WebhookFilterList/WebhookFilterList';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { MediaKind } from '@ValenceContracts/schemas/MediaKind';
import type { WebhookPreset, WebhookSubscribableEvent } from '@ValenceContracts/schemas/Webhook';
import type { WebhookFieldsProps } from './WebhookFields.types';

const PRESET_LABELS: Record<WebhookPreset, StringKey> = {
  generic: 'admin.webhookFields.preset.generic',
  discord: 'admin.webhookFields.preset.discord',
  ntfy: 'admin.webhookFields.preset.ntfy',
};

const ARRIVAL_CHOICES = [
  { id: 'perScan', labelKey: 'admin.webhookFields.perScan' },
  { id: 'perItem', labelKey: 'admin.webhookFields.perItem' },
] as const satisfies readonly { id: string; labelKey: StringKey }[];

const ITEM_TYPE_CHOICES = MEDIA_KINDS.map((kind) => ({
  id: kind,
  label: MEDIA_KIND_LABELS[kind],
}));

/**
 * Narrows a chosen id back to a kind, since a filter list hands back plain strings.
 *
 * @param candidate - What was chosen.
 * @returns Whether it names a kind.
 */
const isMediaKind = (candidate: string): candidate is MediaKind =>
  MEDIA_KINDS.some((kind) => kind === candidate);

/**
 * Everything there is to say about a subscription, asked three questions at a time: where deliveries
 * go, what they are about, and whom they are about.
 *
 * Three panes rather than one column, because there are better than thirty controls here and a
 * single scroll of them reads as a wall — an operator changing which events they want should not
 * have to walk past every account on the server to reach the buttons.
 *
 * One form rather than two, because making a subscription and changing one ask exactly the same
 * questions, and a form that had drifted between the two would let an operator set something on
 * creation they could never change afterwards.
 *
 * @param draft - The subscription as it currently reads.
 * @param onChange - Told the whole draft again whenever any part of it changes.
 * @param accounts - The accounts this subscription can be narrowed to.
 * @param profiles - The profiles this subscription can be narrowed to.
 * @param hasRequests - Whether requesting is on, without which its events are not offered.
 * @param travel - Which way the pane should slide in from.
 */
const WebhookFields = ({
  draft,
  onChange,
  accounts,
  profiles,
  hasRequests = false,
  travel,
}: WebhookFieldsProps) => {
  const noteIdPrefix = useId();

  const setEvents = (events: WebhookSubscribableEvent[]) => {
    onChange({ ...draft, events });
  };

  return (
    <>
      <TabPanel value="where" travel={travel}>
        <div className="flex flex-col gap-4">
          <TextField
            label={say('admin.webhookFields.name')}
            value={draft.name}
            onValueChange={(name) => {
              onChange({ ...draft, name });
            }}
            placeholder={say('admin.webhookFields.namePlaceholder')}
            description={say('admin.webhookFields.nameDescription')}
            required
          />

          <TextField
            label={say('admin.webhookFields.address')}
            type="url"
            value={draft.url}
            onValueChange={(url) => {
              onChange({ ...draft, url });
            }}
            placeholder="https://discord.com/api/webhooks/…"
            description={say('admin.webhookFields.addressDescription')}
            required
          />

          <FormField
            label={say('admin.webhookFields.shape')}
            description={say('admin.webhookFields.shapeDescription')}
          >
            <div className="flex flex-col gap-1.5">
              {WEBHOOK_PRESETS.map((candidate) => (
                <Button
                  key={candidate}
                  variant={draft.preset === candidate ? 'secondary' : 'bare'}
                  size="none"
                  aria-pressed={draft.preset === candidate}
                  className="flex flex-col items-start gap-0.5 px-3 py-2 text-left"
                  onClick={() => {
                    onChange({ ...draft, preset: candidate });
                  }}
                >
                  <span className="text-sm text-text">{candidate}</span>
                  <span className="text-xs text-text-muted">{say(PRESET_LABELS[candidate])}</span>
                </Button>
              ))}
            </div>
          </FormField>
        </div>
      </TabPanel>

      <TabPanel value="events" travel={travel}>
        <div className="flex flex-col gap-5">
          {WEBHOOK_EVENT_GROUPS.filter((group) => hasRequests || group.id !== 'requests').map(
            (group) => {
              const chosenHere = group.events.filter((event) => draft.events.includes(event));
              const isEveryOne = chosenHere.length === group.events.length;

              return (
                <div key={group.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-text">{group.label}</span>

                    <Button
                      variant="bare"
                      size="sm"
                      onClick={() => {
                        setEvents(
                          isEveryOne
                            ? draft.events.filter((event) => !group.events.includes(event))
                            : [
                                ...draft.events,
                                ...group.events.filter((event) => !draft.events.includes(event)),
                              ],
                        );
                      }}
                    >
                      {isEveryOne
                        ? say('admin.webhookFields.none')
                        : say('admin.webhookFields.all')}
                    </Button>
                  </div>

                  <ul
                    role="group"
                    aria-label={group.label}
                    className="flex flex-col divide-y divide-[var(--surface-line)]"
                  >
                    {group.events.map((event) => (
                      <li
                        key={event}
                        className="flex items-start justify-between gap-4 py-2.5 first:pt-0"
                      >
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm font-medium text-text">
                            {WEBHOOK_EVENT_LABELS[event]}
                          </span>

                          {WEBHOOK_EVENT_NOTES[event] === undefined ? null : (
                            <span
                              id={`${noteIdPrefix}-${event}`}
                              className="text-xs leading-relaxed text-text-muted"
                            >
                              {WEBHOOK_EVENT_NOTES[event]}
                            </span>
                          )}
                        </div>

                        <Switch
                          label={WEBHOOK_EVENT_LABELS[event]}
                          isLabelHidden
                          isOn={draft.events.includes(event)}
                          onToggle={() => {
                            setEvents(
                              draft.events.includes(event)
                                ? draft.events.filter((one) => one !== event)
                                : [...draft.events, event],
                            );
                          }}
                          {...(WEBHOOK_EVENT_NOTES[event] === undefined
                            ? {}
                            : { describedBy: `${noteIdPrefix}-${event}` })}
                          className="mt-0.5 shrink-0"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            },
          )}
        </div>
      </TabPanel>

      <TabPanel value="who" travel={travel}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-text">
                {say('admin.webhookFields.whenThingsArrive')}
              </span>
              <span className="text-xs text-text-muted">
                {say('admin.webhookFields.arrivalDetail')}
              </span>
            </div>

            <SegmentedRow
              label={say('admin.webhookFields.arrivalLabel')}
              tone="accent"
              size="sm"
              items={ARRIVAL_CHOICES.map((choice) => ({
                id: choice.id,
                label: say(choice.labelKey),
              }))}
              value={draft.filters.mediaAdded}
              onSelect={(id) => {
                onChange({
                  ...draft,
                  filters: {
                    ...draft.filters,
                    mediaAdded: id === 'perItem' ? 'perItem' : 'perScan',
                  },
                });
              }}
            />
          </div>

          <WebhookFilterList
            title={say('admin.webhookFields.accounts')}
            governs={say('admin.webhookFields.accountsGoverns')}
            choices={accounts}
            chosen={draft.filters.accounts}
            nothingToChoose={say('admin.webhookFields.noAccounts')}
            onChange={(chosen) => {
              onChange({ ...draft, filters: { ...draft.filters, accounts: chosen } });
            }}
          />

          <WebhookFilterList
            title={say('admin.webhookFields.profiles')}
            governs={say('admin.webhookFields.profilesGoverns')}
            choices={profiles}
            chosen={draft.filters.profiles}
            nothingToChoose={say('admin.webhookFields.noProfiles')}
            onChange={(chosen) => {
              onChange({ ...draft, filters: { ...draft.filters, profiles: chosen } });
            }}
          />

          <WebhookFilterList
            title={say('admin.webhookFields.kinds')}
            governs={say('admin.webhookFields.kindsGoverns')}
            choices={ITEM_TYPE_CHOICES}
            chosen={draft.filters.itemTypes}
            nothingToChoose={say('admin.webhookFields.nothingToChoose')}
            onChange={(chosen) => {
              onChange({
                ...draft,
                filters: { ...draft.filters, itemTypes: chosen.filter(isMediaKind) },
              });
            }}
          />
        </div>
      </TabPanel>
    </>
  );
};

WebhookFields.displayName = 'WebhookFields';

export { WebhookFields };
