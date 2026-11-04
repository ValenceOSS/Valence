import { describe, expect, it } from 'vitest';
import { DEFAULT_CUSTOM_WEBHOOK } from '@ValenceContracts/constants/DEFAULT_CUSTOM_WEBHOOK';
import { renderWebhookTemplate } from '@ValenceContracts/functions/renderWebhookTemplate';
import { CustomWebhookSchema } from '@ValenceContracts/schemas/Webhook';

describe('DEFAULT_CUSTOM_WEBHOOK', () => {
  it('is a setup the schema accepts, signed and posted as JSON', () => {
    expect(CustomWebhookSchema.parse(DEFAULT_CUSTOM_WEBHOOK)).toStrictEqual(DEFAULT_CUSTOM_WEBHOOK);
    expect(DEFAULT_CUSTOM_WEBHOOK).toMatchObject({
      method: 'POST',
      format: 'json',
      isSigned: true,
    });
  });

  it('has a template that fills without a problem', () => {
    expect(
      renderWebhookTemplate(DEFAULT_CUSTOM_WEBHOOK.template, 'json', { title: 'A' }).problem,
    ).toBeNull();
  });
});
