import { useId } from 'react';
import { Button } from '@ValenceUI/Button';
import { ChoiceList } from '@ValenceUI/ChoiceList';
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
import type { MediaKind } from '@ValenceContracts/schemas/MediaKind';
import type { WebhookPreset, WebhookSubscribableEvent } from '@ValenceContracts/schemas/Webhook';
import type { WebhookFieldsProps } from './WebhookFields.types';
import { say } from '@ValenceI18n/say';

const PRESET_NAMES: Record<WebhookPreset, string> = {
  generic: say('screens.adminArea.webhookFields.generic'),
  discord: say('screens.adminArea.webhookFields.discord'),
  ntfy: say('screens.adminArea.webhookFields.ntfy'),
};

const PRESET_LABELS: Record<WebhookPreset, string> = {
  generic: say('screens.adminArea.webhookFields.valencesOwnEnvelopeAsJSONBuild'),
  discord: say('screens.adminArea.webhookFields.aMessageInADiscordChannel'),
  ntfy: say('screens.adminArea.webhookFields.aNotificationThroughNtfy'),
};

const ARRIVAL_CHOICES = [
  { id: 'perScan', label: say('screens.adminArea.webhookFields.oncePerScan') },
  { id: 'perItem', label: say('screens.adminArea.webhookFields.oneForEachThing') },
] as const;

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
 * @param errors - What is wrong with the name, the address and the events, beneath each.
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
  errors = {},
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
            label={say('common.name')}
            value={draft.name}
            onValueChange={(name) => {
              onChange({ ...draft, name });
            }}
            placeholder={say('screens.adminArea.webhookFields.discord')}
            description={say('screens.adminArea.webhookFields.whatThisIsCalledInThe')}
            {...(errors.name === undefined ? {} : { error: errors.name })}
          />

          <TextField
            label={say('common.address')}
            type="url"
            value={draft.url}
            onValueChange={(url) => {
              onChange({ ...draft, url });
            }}
            placeholder="https://discord.com/api/webhooks/…"
            description={say('screens.adminArea.webhookFields.whereTheDeliveriesArePosted')}
            {...(errors.url === undefined ? {} : { error: errors.url })}
          />

          <FormField
            label={say('screens.adminArea.webhookFields.shape')}
            description={say('screens.adminArea.webhookFields.whatValenceSendsSoTheOther')}
          >
            <ChoiceList
              label={say('screens.adminArea.webhookFields.shape')}
              choices={WEBHOOK_PRESETS.map((candidate) => ({
                id: candidate,
                title: PRESET_NAMES[candidate],
                detail: PRESET_LABELS[candidate],
              }))}
              value={draft.preset}
              onChoose={(next) => {
                const chosen = WEBHOOK_PRESETS.find((candidate) => candidate === next);

                if (chosen !== undefined) {
                  onChange({ ...draft, preset: chosen });
                }
              }}
            />
          </FormField>
        </div>
      </TabPanel>

      <TabPanel value="events" travel={travel}>
        <div className="flex flex-col gap-5">
          {errors.events === undefined ? null : (
            <p role="alert" className="font-body text-xs leading-snug text-danger">
              {errors.events}
            </p>
          )}

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
                      {isEveryOne ? say('common.none') : say('common.all')}
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
                {say('screens.adminArea.webhookFields.whenThingsArrive')}
              </span>
              <span className="text-xs text-text-muted">
                {say('screens.adminArea.webhookFields.aFirstScanOfALarge')}
              </span>
            </div>

            <SegmentedRow
              label={say('screens.adminArea.webhookFields.howArrivalsAreReported')}
              tone="accent"
              size="sm"
              items={ARRIVAL_CHOICES}
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
            title={say('common.accounts')}
            governs={say('screens.adminArea.webhookFields.decidesWhoseSignInsAndAccount')}
            choices={accounts}
            chosen={draft.filters.accounts}
            nothingToChoose={say('screens.adminArea.webhookFields.thisServerHasNoOtherAccounts')}
            onChange={(chosen) => {
              onChange({ ...draft, filters: { ...draft.filters, accounts: chosen } });
            }}
          />

          <WebhookFilterList
            title={say('common.profiles')}
            governs={say('screens.adminArea.webhookFields.decidesWhoseWatchingIsReported')}
            choices={profiles}
            chosen={draft.filters.profiles}
            nothingToChoose={say('screens.adminArea.webhookFields.thisServerHasNoProfilesYet')}
            onChange={(chosen) => {
              onChange({ ...draft, filters: { ...draft.filters, profiles: chosen } });
            }}
          />

          <WebhookFilterList
            title={say('screens.adminArea.webhookFields.kinds')}
            governs={say(
              'screens.adminArea.webhookFields.decidesWhichKindsAreReportedSongsByName',
              {
                song: MEDIA_KIND_LABELS.song,
              },
            )}
            choices={ITEM_TYPE_CHOICES}
            chosen={draft.filters.itemTypes}
            nothingToChoose={say('screens.adminArea.webhookFields.nothingToChooseFrom')}
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
