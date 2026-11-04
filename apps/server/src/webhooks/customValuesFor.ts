import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { WEBHOOK_EVENT_LABELS } from '@ValenceContracts/schemas/Webhook';
import { webhookNoticeFor } from './webhookNoticeFor';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { WebhookPayload } from '@ValenceContracts/schemas/Webhook';
import type { WebhookBrand } from './WebhookBrand';

/**
 * Everything a Custom webhook's template can name for one event: the same headline, line and detail
 * every other service is sent, what kind of event it is and when, which server sent it, and the
 * event's own data as it is delivered to a Generic webhook.
 *
 * @param payload - The event.
 * @param brand - How the server names itself, and its address where known.
 * @returns The values, by the names a template uses for them.
 */
const customValuesFor = (payload: WebhookPayload, brand: WebhookBrand): JsonValue => {
  const notice = webhookNoticeFor(payload, brand.name);
  const lead = notice.lead.map((part) => (typeof part === 'string' ? part : part.strong)).join('');

  return {
    event: payload.event,
    eventLabel: WEBHOOK_EVENT_LABELS[payload.event],
    id: payload.id,
    occurredAt: payload.occurredAt,
    title: notice.title,
    summary: lead === '' ? notice.context.join(' · ') : lead,
    body: [notice.body, ...notice.details.map((detail) => detail.text)]
      .filter((part) => part !== '')
      .join('\n\n'),
    poster: notice.posterUrl,
    link: notice.link?.url ?? null,
    urgent: notice.isUrgent,
    tone: notice.tone,
    server: { name: brand.name, url: brand.url },
    data: JsonValueSchema.parse(JSON.parse(JSON.stringify(payload.data))),
  };
};

export { customValuesFor };
