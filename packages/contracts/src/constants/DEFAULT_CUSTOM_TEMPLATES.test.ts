import { describe, expect, it } from 'vitest';
import { DEFAULT_CUSTOM_TEMPLATES } from '@ValenceContracts/constants/DEFAULT_CUSTOM_TEMPLATES';
import { renderWebhookTemplate } from '@ValenceContracts/functions/renderWebhookTemplate';

describe('DEFAULT_CUSTOM_TEMPLATES', () => {
  it('has a template for every body format that fills without a problem', () => {
    for (const format of ['json', 'text', 'form'] as const) {
      expect(
        renderWebhookTemplate(DEFAULT_CUSTOM_TEMPLATES[format], format, {}).problem,
      ).toBeNull();
    }
  });
});
