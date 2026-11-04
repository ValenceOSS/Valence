import type { CustomWebhookFormat } from '@ValenceContracts/schemas/Webhook';

const JSON_TEMPLATE = `{
  "event": "{{event}}",
  "title": "{{title}}",
  "message": "{{summary}}",
  "details": "{{body}}",
  "urgent": "{{urgent}}",
  "image": "{{poster}}",
  "link": "{{link}}",
  "server": "{{server.name}}",
  "at": "{{occurredAt}}"
}`;

const DEFAULT_CUSTOM_TEMPLATES: Readonly<Record<CustomWebhookFormat, string>> = {
  json: JSON_TEMPLATE,
  form: JSON_TEMPLATE,
  // oxlint-disable-next-line valence/no-hard-coded-strings -- a template's placeholders, never shown as words
  text: '{{title}}: {{summary}}',
};

export { DEFAULT_CUSTOM_TEMPLATES };
