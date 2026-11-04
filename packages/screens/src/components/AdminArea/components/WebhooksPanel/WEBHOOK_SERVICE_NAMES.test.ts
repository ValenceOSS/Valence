import { describe, expect, it } from 'vitest';
import { WEBHOOK_PRESETS } from '@ValenceContracts/schemas/Webhook';
import { WEBHOOK_SERVICE_NAMES } from './WEBHOOK_SERVICE_NAMES';

describe('WEBHOOK_SERVICE_NAMES', () => {
  it('names every service a webhook can post to', () => {
    for (const preset of WEBHOOK_PRESETS) {
      expect(WEBHOOK_SERVICE_NAMES[preset]).not.toBe('');
    }
  });

  it('calls the service whose request the admin writes Custom', () => {
    expect(WEBHOOK_SERVICE_NAMES.custom).toBe('Custom');
    expect(WEBHOOK_SERVICE_NAMES.discord).toBe('Discord');
  });
});
