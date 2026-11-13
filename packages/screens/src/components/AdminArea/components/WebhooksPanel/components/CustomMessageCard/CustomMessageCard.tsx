import { useRef, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SelectField } from '@ValenceUI/SelectField';
import { TextField } from '@ValenceUI/TextField';
import {
  CUSTOM_WEBHOOK_CONTENT_TYPES,
  WEBHOOK_EVENT_LABELS,
  WEBHOOK_EVENTS,
} from '@ValenceContracts/schemas/Webhook';
import { renderWebhookTemplate } from '@ValenceContracts/functions/renderWebhookTemplate';
import { DEFAULT_CUSTOM_TEMPLATES } from '@ValenceContracts/constants/DEFAULT_CUSTOM_TEMPLATES';
import { SAMPLE_EVENTS } from './SAMPLE_EVENTS';
import { describeTemplateProblem } from './describeTemplateProblem';
import { pathsOf } from './pathsOf';
import type { WebhookEvent } from '@ValenceContracts/schemas/Webhook';
import type { CustomMessageCardProps } from './CustomMessageCard.types';
import { sayCount } from '@ValenceI18n/sayCount';
import { say } from '@ValenceI18n/say';

const HIDDEN = '••••••••';

const MESSAGE_VARIABLES = [
  { path: 'title', about: say('screens.adminArea.customMessageCard.aHeadlineForTheEvent') },
  { path: 'summary', about: say('screens.adminArea.customMessageCard.oneLineSayingWhatHappened') },
  { path: 'body', about: say('screens.adminArea.customMessageCard.moreDetailWhereThereIsAny') },
  { path: 'poster', about: say('screens.adminArea.customMessageCard.aPosterOrCoverAddress') },
  { path: 'link', about: say('screens.adminArea.customMessageCard.whereToSeeItInValence') },
  { path: 'urgent', about: say('screens.adminArea.customMessageCard.trueWhenItNeedsLookingAt') },
];

const EVENT_VARIABLES = [
  { path: 'event', about: say('screens.adminArea.customMessageCard.theEventsNameLikeJobFailed') },
  { path: 'eventLabel', about: say('screens.adminArea.customMessageCard.itsNameInWords') },
  {
    path: 'tone',
    about: say('screens.adminArea.customMessageCard.failureAttentionArrivalViewingOrQuiet'),
  },
  { path: 'occurredAt', about: say('screens.adminArea.customMessageCard.whenAsAnISODate') },
  { path: 'id', about: say('screens.adminArea.customMessageCard.aUniqueIdForTheDelivery') },
  { path: 'server.name', about: say('screens.adminArea.customMessageCard.thisServersName') },
  { path: 'server.url', about: say('screens.adminArea.customMessageCard.thisServersAddress') },
];

const SAMPLED: readonly WebhookEvent[] = WEBHOOK_EVENTS.filter(
  (event) => SAMPLE_EVENTS[event] !== undefined,
);

/**
 * The Custom service's message: the template on the left with its placeholders above it, and the
 * request it makes on the right, filled with a sample of whichever event is picked. The template
 * saves with its own button, and not while it cannot be read.
 *
 * @param setup - The Custom service's saved setup.
 * @param subscribed - The events the webhook sends, offered first to preview.
 * @param url - Where it posts.
 * @param onSave - Saves a new template, answering whether it worked.
 */
const CustomMessageCard = ({ setup, subscribed, url, onSave }: CustomMessageCardProps) => {
  const offered = [
    ...SAMPLED.filter((event) => subscribed.includes(event)),
    ...SAMPLED.filter((event) => !subscribed.includes(event)),
  ];
  const [previewing, setPreviewing] = useState<WebhookEvent>(offered[0] ?? 'webhook.test');
  const [edited, setEdited] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const template = edited ?? setup.template;
  const values = SAMPLE_EVENTS[previewing] ?? null;
  const rendered = renderWebhookTemplate(template, setup.format, values);
  const fallback = DEFAULT_CUSTOM_TEMPLATES[setup.format];
  const isChanged = template !== setup.template;
  const data =
    values !== null && typeof values === 'object' && !Array.isArray(values)
      ? (values['data'] ?? {})
      : {};
  const dataPaths = pathsOf(data, 'data').filter((one) => one.path !== 'data');

  const insert = (path: string) => {
    const field = area.current;
    const token = `{{${path}}}`;

    if (field === null) {
      setEdited(`${template}${token}`);

      return;
    }

    const start = field.selectionStart;

    setEdited(`${template.slice(0, start)}${token}${template.slice(field.selectionEnd)}`);
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const request = [
    `${setup.method} ${url}`,
    `Content-Type: ${CUSTOM_WEBHOOK_CONTENT_TYPES[setup.format]}`,
    ...(setup.isSigned ? [`X-Valence-Signature: sha256=${HIDDEN}`] : []),
    ...setup.headers.map((header) => `${header.name}: ${header.isSecret ? HIDDEN : header.value}`),
    '',
    rendered.problem === null ? rendered.body : '',
  ].join('\n');

  return (
    <PanelCard
      title={say('screens.adminArea.sessionCard.message')}
      isFlush
      actions={
        <span className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={template === fallback}
            onClick={() => {
              setEdited(fallback);
            }}
          >
            {say('screens.adminArea.customMessageCard.resetToDefault')}
          </Button>
          {isChanged ? (
            <Button
              variant="confirm"
              size="sm"
              isLoading={isSaving}
              disabled={rendered.problem !== null}
              onClick={() => {
                setIsSaving(true);
                void onSave(template)
                  .then((isSaved) => {
                    if (isSaved) {
                      setEdited(null);
                    }
                  })
                  .finally(() => {
                    setIsSaving(false);
                  });
              }}
            >
              {say('common.save')}
            </Button>
          ) : null}
        </span>
      }
    >
      <div className="grid xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3 p-4 xl:border-e xl:border-[var(--surface-line)]">
          <div className="flex flex-wrap items-center gap-1.5">
            {MESSAGE_VARIABLES.map((one) => (
              <Button
                key={one.path}
                variant="soft"
                size="xs"
                className="font-mono"
                title={one.about}
                onClick={() => {
                  insert(one.path);
                }}
              >
                {one.path}
              </Button>
            ))}
            <ActionMenu
              label={say('screens.adminArea.customMessageCard.morePlaceholders')}
              look="labelled"
              size="sm"
              trigger={
                <span className="text-xs">{say('screens.adminArea.customMessageCard.more')}</span>
              }
              groups={[
                {
                  name: say('screens.adminArea.customMessageCard.theEvent'),
                  items: EVENT_VARIABLES.map((one) => ({
                    id: one.path,
                    label: one.path,
                    detail: one.about,
                    onChoose: () => {
                      insert(one.path);
                    },
                  })),
                },
                {
                  name: say('screens.adminArea.customMessageCard.eventsData', {
                    event: WEBHOOK_EVENT_LABELS[previewing],
                  }),
                  items: dataPaths.map((one) => ({
                    id: one.path,
                    label: one.path,
                    detail: say('screens.adminArea.customMessageCard.forExample', {
                      example: one.example,
                    }),
                    onChoose: () => {
                      insert(one.path);
                    },
                  })),
                },
              ]}
            />
          </div>

          <TextField
            label={say('screens.adminArea.customMessageCard.template')}
            isLabelHidden
            rows={15}
            isCode
            areaRef={area}
            value={template}
            onValueChange={setEdited}
            {...(rendered.problem === null
              ? {}
              : { error: describeTemplateProblem(rendered.problem) })}
          />

          <p className="text-xs leading-relaxed text-text-muted">
            {setup.format === 'text'
              ? say('screens.adminArea.customMessageCard.placeholdersAreSwappedInAsThey')
              : setup.format === 'form'
                ? say('screens.adminArea.customMessageCard.writeTheFieldsAsAJSON')
                : say('screens.adminArea.customMessageCard.valuesAreEscapedSoTheyCant')}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-3 border-t border-[var(--surface-line)] p-4 xl:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-text-muted">
              {say('screens.adminArea.mediaTitlePage.showInTheApp')}
            </span>
            <SelectField
              label={say('screens.adminArea.customMessageCard.eventToPreview')}
              isLabelHidden
              size="sm"
              className="w-56"
              options={offered.map((event) => ({ id: event, label: WEBHOOK_EVENT_LABELS[event] }))}
              value={previewing}
              onSelect={(id) => {
                const event = SAMPLED.find((one) => one === id);

                if (event !== undefined) {
                  setPreviewing(event);
                }
              }}
            />
          </div>

          {rendered.unknown.length === 0 ? null : (
            <p className="text-xs text-warning">
              {sayCount(
                'screens.adminArea.customMessageCard.count.placeholdersLeftEmpty',
                rendered.unknown.length,
                {
                  placeholders: rendered.unknown.map((path) => `{{${path}}}`).join(', '),
                },
              )}
            </p>
          )}

          <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[var(--surface-hover)] p-3 font-mono text-xs leading-relaxed text-text">
            {request}
          </pre>
        </div>
      </div>
    </PanelCard>
  );
};

CustomMessageCard.displayName = 'CustomMessageCard';

export { CustomMessageCard };
