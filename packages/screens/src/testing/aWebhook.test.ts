import { describe, expect, it } from 'vitest';
import { aWebhook } from '@ValenceScreens/testing/aWebhook';

describe('aWebhook', () => {
  it('is a Discord webhook never used yet, with what a test changes', () => {
    expect(aWebhook()).toMatchObject({ preset: 'discord', lastAttemptAt: null, custom: null });
    expect(aWebhook({ name: 'Alerts' }).name).toBe('Alerts');
  });
});
