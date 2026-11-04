import { describe, expect, it } from 'vitest';
import { lastDeliveryOf } from './lastDeliveryOf';
import { aWebhook } from '@ValenceScreens/testing/aWebhook';

const WEBHOOK = aWebhook();

describe('lastDeliveryOf', () => {
  it('says a webhook that has never sent anything was never used', () => {
    expect(lastDeliveryOf(WEBHOOK)).toEqual({ tone: 'quiet', label: 'Never used' });
  });

  it('says the last delivery went through', () => {
    expect(lastDeliveryOf({ ...WEBHOOK, lastAttemptAt: '2026-08-15T20:00:00.000Z' })).toEqual({
      tone: 'success',
      label: 'Delivered',
    });
  });

  it('says a webhook whose last delivery failed is failing', () => {
    expect(
      lastDeliveryOf({
        ...WEBHOOK,
        lastAttemptAt: '2026-08-15T20:00:00.000Z',
        lastError: 'The receiver answered 500.',
      }),
    ).toEqual({ tone: 'danger', label: 'Failing' });
  });
});
