import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { createDatabaseWebhookStore } from './createDatabaseWebhookStore';
import type { CustomWebhook } from '@ValenceContracts/schemas/Webhook';

const STARTING_POSTGRES_MS = 60_000;

const A_SUBSCRIPTION = {
  name: 'Discord',
  url: 'https://discord.com/api/webhooks/1/abc',
  preset: 'discord',
  events: ['job.failed'],
} as const;

const CUSTOM: CustomWebhook = {
  method: 'PUT',
  format: 'text',
  template: '{{title}}',
  headers: [
    { name: 'Authorization', value: 'Bearer token', isSecret: true },
    { name: 'X-Source', value: 'valence', isSecret: false },
  ],
  isSigned: false,
};

const LANDED = { ok: true, status: 200, error: null };

const REFUSED = { ok: false, status: 503, error: 'The receiver answered 503.' };

const anOccurrence = (eventId: string, subscriptionId: string) => ({
  subscriptionId,
  eventId,
  event: 'job.failed' as const,
  body: JSON.stringify({ id: eventId, event: 'job.failed' }),
});

describe('createDatabaseWebhookStore', () => {
  it(
    'answers a subscription as it is once changed, and nothing for one that never was',
    async () => {
      const store = createDatabaseWebhookStore(await aMigratedDatabase());
      const { subscription } = await store.create({ ...A_SUBSCRIPTION, events: ['job.failed'] });

      expect(
        await store.update(subscription.id, { name: 'Renamed', enabled: false }),
      ).toMatchObject({
        id: subscription.id,
        name: 'Renamed',
        enabled: false,
        url: A_SUBSCRIPTION.url,
      });
      expect(await store.update('missing', { enabled: false })).toBeNull();
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'says whether a removal found anything to remove',
    async () => {
      const store = createDatabaseWebhookStore(await aMigratedDatabase());
      const { subscription } = await store.create({ ...A_SUBSCRIPTION, events: ['job.failed'] });

      expect(await store.remove(subscription.id)).toBe(true);
      expect(await store.remove(subscription.id)).toBe(false);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'counts a retry as another try at the same delivery, and tells two events apart',
    async () => {
      const store = createDatabaseWebhookStore(await aMigratedDatabase());
      const { subscription } = await store.create({ ...A_SUBSCRIPTION, events: ['job.failed'] });

      await store.recordDelivery(anOccurrence('event-1', subscription.id), REFUSED);
      await store.recordDelivery(anOccurrence('event-1', subscription.id), REFUSED);
      await store.recordDelivery(anOccurrence('event-1', subscription.id), LANDED);
      await store.recordDelivery(anOccurrence('event-2', subscription.id), REFUSED);

      const filed = await store.listDeliveries(subscription.id, 10);

      expect(filed).toHaveLength(2);
      expect(filed.map((one) => one.attempts).sort()).toStrictEqual([1, 3]);
      expect(filed.find((one) => one.attempts === 3)).toMatchObject({ ok: true, status: 200 });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'prunes deliveries last tried before the cut-off, answering how many went',
    async () => {
      const store = createDatabaseWebhookStore(await aMigratedDatabase());
      const { subscription } = await store.create({ ...A_SUBSCRIPTION, events: ['job.failed'] });

      await store.recordDelivery(anOccurrence('event-1', subscription.id), LANDED);
      await store.recordDelivery(anOccurrence('event-2', subscription.id), LANDED);

      expect(await store.pruneDeliveries(new Date(Date.now() - 60_000))).toBe(0);
      expect(await store.pruneDeliveries(new Date(Date.now() + 60_000))).toBe(2);
      expect(await store.listDeliveries(subscription.id, 10)).toStrictEqual([]);
    },
    STARTING_POSTGRES_MS,
  );
  it(
    'keeps a subscription off the local network until it is allowed',
    async () => {
      const store = createDatabaseWebhookStore(await aMigratedDatabase());
      const { subscription } = await store.create({ ...A_SUBSCRIPTION, events: ['job.failed'] });

      expect(subscription.reachesLocalNetwork).toBe(false);
      expect((await store.readTarget(subscription.id))?.reachesLocalNetwork).toBe(false);

      const changed = await store.update(subscription.id, { reachesLocalNetwork: true });

      expect(changed?.reachesLocalNetwork).toBe(true);
      expect((await store.readTarget(subscription.id))?.reachesLocalNetwork).toBe(true);
    },
    STARTING_POSTGRES_MS,
  );
  it(
    'stores a Custom setup, shows it with its secrets hidden and keeps a secret saved back empty',
    async () => {
      const store = createDatabaseWebhookStore(await aMigratedDatabase());
      const { subscription } = await store.create({
        ...A_SUBSCRIPTION,
        preset: 'custom',
        events: ['job.failed'],
        custom: CUSTOM,
      });

      expect(subscription.custom?.headers[0]?.value).toBe('');
      expect((await store.list())[0]?.custom?.headers[0]?.value).toBe('');
      expect((await store.readTarget(subscription.id))?.custom).toStrictEqual(CUSTOM);

      const shown = subscription.custom;

      if (shown === null) {
        throw new Error('No setup was shown.');
      }

      const changed = await store.update(subscription.id, {
        custom: { ...shown, template: '{{summary}}' },
      });

      expect(changed?.custom?.template).toBe('{{summary}}');
      expect((await store.readTarget(subscription.id))?.custom?.headers[0]?.value).toBe(
        'Bearer token',
      );
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'reads a subscription made before Custom setups as having none',
    async () => {
      const store = createDatabaseWebhookStore(await aMigratedDatabase());
      const { subscription } = await store.create({ ...A_SUBSCRIPTION, events: ['job.failed'] });

      expect((await store.list())[0]?.custom).toBeNull();
      expect((await store.readTarget(subscription.id))?.custom).toBeNull();
    },
    STARTING_POSTGRES_MS,
  );
});
