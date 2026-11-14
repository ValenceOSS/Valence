import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryWebhookStore } from './createMemoryWebhookStore';
import type { WebhookStore } from './WebhookStore';
import type { CustomWebhook } from '@ValenceContracts/schemas/Webhook';

const aSubscription = {
  name: 'Discord',
  url: 'https://discord.com/api/webhooks/1/abc',
  preset: 'discord',
  events: ['job.failed'],
} as const;

const aFailure = {
  event: 'job.failed',
  data: {
    kind: 'library.scan',
    label: 'Scan for changes',
    jobId: 'job-1',
    subject: null,
    subjectName: null,
    reason: 'no space left',
  },
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

let store: WebhookStore;

beforeEach(() => {
  store = createMemoryWebhookStore();
});

describe('createMemoryWebhookStore', () => {
  it('answers the secret once, on creation', async () => {
    const created = await store.create({ ...aSubscription, events: ['job.failed'] });

    expect(created.secret).not.toBe('');
    expect(Object.keys(created.subscription)).not.toContain('secret');
  });

  it('starts a subscription enabled and never delivered to', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    expect(subscription.enabled).toBe(true);
    expect(subscription.lastAttemptAt).toBeNull();
  });

  it('tells the bus which subscriptions asked for an event', async () => {
    const wanted = await store.create({ ...aSubscription, events: ['job.failed'] });
    await store.create({ ...aSubscription, events: ['job.completed'] });

    expect(await store.listenersFor(aFailure)).toStrictEqual([wanted.subscription.id]);
  });

  it('leaves out a subscription that has been turned off', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    await store.update(subscription.id, { enabled: false });

    expect(await store.listenersFor(aFailure)).toStrictEqual([]);
    expect(await store.readTarget(subscription.id)).toBeNull();
  });

  it('gives the delivery job the secret and nothing else needs it', async () => {
    const created = await store.create({ ...aSubscription, events: ['job.failed'] });

    const target = await store.readTarget(created.subscription.id);

    expect(target).toStrictEqual({
      url: aSubscription.url,
      preset: 'discord',
      secret: created.secret,
      custom: null,
      reachesLocalNetwork: false,
    });
  });

  it('keeps a subscription off the local network until it is allowed, and says so to the delivery job', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    expect(subscription.reachesLocalNetwork).toBe(false);
    expect((await store.readTarget(subscription.id))?.reachesLocalNetwork).toBe(false);

    const changed = await store.update(subscription.id, { reachesLocalNetwork: true });

    expect(changed?.reachesLocalNetwork).toBe(true);
    expect((await store.readTarget(subscription.id))?.reachesLocalNetwork).toBe(true);
  });

  it('has nothing to deliver to once a subscription is deleted', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    expect(await store.remove(subscription.id)).toBe(true);
    expect(await store.readTarget(subscription.id)).toBeNull();
    expect(await store.list()).toStrictEqual([]);
  });

  it('remembers how the last attempt went', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    await store.recordAttempt(subscription.id, {
      ok: false,
      status: 500,
      error: 'The receiving server returned 500.',
    });

    const [read] = await store.list();

    expect(read).toMatchObject({
      lastStatus: 500,
      lastError: 'The receiving server returned 500.',
    });
    expect(read?.lastAttemptAt).not.toBeNull();
  });

  it('answers nothing for a subscription that never existed', async () => {
    expect(await store.update('missing', { enabled: false })).toBeNull();
    expect(await store.remove('missing')).toBe(false);
    expect(await store.readTarget('missing')).toBeNull();
  });
});

const anOccurrence = (eventId: string, subscriptionId: string) => ({
  subscriptionId,
  eventId,
  event: 'job.failed' as const,
  body: JSON.stringify({ id: eventId, event: 'job.failed' }),
});

const landed = { ok: true, status: 200, error: null };

const refused = { ok: false, status: 503, error: 'The receiving server returned 503.' };

describe('the delivery history', () => {
  it('files a delivery', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    await store.recordDelivery(anOccurrence('event-1', subscription.id), landed);

    const [filed] = await store.listDeliveries(subscription.id, 10);

    expect(filed).toMatchObject({ event: 'job.failed', attempts: 1, ok: true, status: 200 });
  });

  it('counts a retry as another try at the same delivery, not a second one', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    await store.recordDelivery(anOccurrence('event-1', subscription.id), refused);
    await store.recordDelivery(anOccurrence('event-1', subscription.id), refused);
    await store.recordDelivery(anOccurrence('event-1', subscription.id), landed);

    const filed = await store.listDeliveries(subscription.id, 10);

    expect(filed).toHaveLength(1);
    expect(filed[0]).toMatchObject({ attempts: 3, ok: true });
  });

  it('keeps the moment it was first tried, not only the last', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    await store.recordDelivery(anOccurrence('event-1', subscription.id), refused);
    await store.recordDelivery(anOccurrence('event-1', subscription.id), landed);

    const [filed] = await store.listDeliveries(subscription.id, 10);

    expect(filed?.firstAttemptAt).not.toBeUndefined();
    expect(filed?.firstAttemptAt.localeCompare(filed.lastAttemptAt)).toBeLessThanOrEqual(0);
  });

  it('tells two different events apart', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    await store.recordDelivery(anOccurrence('event-1', subscription.id), landed);
    await store.recordDelivery(anOccurrence('event-2', subscription.id), refused);

    expect(await store.listDeliveries(subscription.id, 10)).toHaveLength(2);
  });

  it('keeps one subscriber out of another subscriber history', async () => {
    const mine = await store.create({ ...aSubscription, events: ['job.failed'] });
    const theirs = await store.create({ ...aSubscription, events: ['job.failed'] });

    await store.recordDelivery(anOccurrence('event-1', mine.subscription.id), landed);

    expect(await store.listDeliveries(theirs.subscription.id, 10)).toStrictEqual([]);
  });

  it('shows no more than was asked for', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    await store.recordDelivery(anOccurrence('event-1', subscription.id), landed);
    await store.recordDelivery(anOccurrence('event-2', subscription.id), landed);
    await store.recordDelivery(anOccurrence('event-3', subscription.id), landed);

    expect(await store.listDeliveries(subscription.id, 2)).toHaveLength(2);
  });

  it('keeps the exact bytes, so a redelivery can be identical', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });
    const occurrence = anOccurrence('event-1', subscription.id);

    await store.recordDelivery(occurrence, landed);

    const [filed] = await store.listDeliveries(subscription.id, 10);

    expect(await store.readDeliveryBody(subscription.id, filed?.id ?? '')).toBe(occurrence.body);
  });

  it('will not hand one subscription the body of another delivery', async () => {
    const mine = await store.create({ ...aSubscription, events: ['job.failed'] });
    const theirs = await store.create({ ...aSubscription, events: ['job.failed'] });

    await store.recordDelivery(anOccurrence('event-1', mine.subscription.id), landed);

    const [filed] = await store.listDeliveries(mine.subscription.id, 10);

    expect(await store.readDeliveryBody(theirs.subscription.id, filed?.id ?? '')).toBeNull();
  });

  it('forgets what is older than the horizon and keeps what is not', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    await store.recordDelivery(anOccurrence('event-1', subscription.id), landed);

    expect(await store.pruneDeliveries(new Date(Date.now() - 60_000))).toBe(0);
    expect(await store.listDeliveries(subscription.id, 10)).toHaveLength(1);

    expect(await store.pruneDeliveries(new Date(Date.now() + 60_000))).toBe(1);
    expect(await store.listDeliveries(subscription.id, 10)).toStrictEqual([]);
  });
});

describe('changing a subscription that already exists', () => {
  it('changes which events it asks for, keeping its secret', async () => {
    const created = await store.create({ ...aSubscription, events: ['job.failed'] });

    const changed = await store.update(created.subscription.id, {
      events: ['playback.started'],
    });

    expect(changed?.events).toStrictEqual(['playback.started']);
    expect(await store.readTarget(created.subscription.id)).toMatchObject({
      secret: created.secret,
    });
  });

  it('repoints a subscription somewhere else', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    const changed = await store.update(subscription.id, { url: 'https://elsewhere.test/hook' });

    expect(changed?.url).toBe('https://elsewhere.test/hook');
  });

  it('leaves alone everything the change did not mention', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    const changed = await store.update(subscription.id, { name: 'Renamed' });

    expect(changed).toMatchObject({
      name: 'Renamed',
      url: aSubscription.url,
      preset: 'discord',
      events: ['job.failed'],
      enabled: true,
    });
  });

  it('stops delivering what it no longer asks for', async () => {
    const { subscription } = await store.create({ ...aSubscription, events: ['job.failed'] });

    await store.update(subscription.id, { events: ['job.completed'] });

    expect(await store.listenersFor(aFailure)).toStrictEqual([]);
  });
  it('shows a Custom setup with its secrets hidden, and hands delivery the whole of it', async () => {
    const { subscription } = await store.create({
      ...aSubscription,
      events: ['job.failed'],
      preset: 'custom',
      custom: CUSTOM,
    });

    expect(subscription.custom?.headers[0]?.value).toBe('');
    expect(subscription.custom?.headers[1]?.value).toBe('valence');
    expect((await store.list())[0]?.custom?.headers[0]?.value).toBe('');
    expect((await store.readTarget(subscription.id))?.custom).toStrictEqual(CUSTOM);
  });

  it('keeps a secret saved back empty, and clears the setup when asked', async () => {
    const { subscription } = await store.create({
      ...aSubscription,
      events: ['job.failed'],
      preset: 'custom',
      custom: CUSTOM,
    });
    const shown = subscription.custom;

    if (shown === null) {
      throw new Error('No setup was shown.');
    }

    await store.update(subscription.id, { custom: { ...shown, template: '{{summary}}' } });

    expect((await store.readTarget(subscription.id))?.custom).toStrictEqual({
      ...CUSTOM,
      template: '{{summary}}',
    });

    await store.update(subscription.id, { custom: null });

    expect((await store.readTarget(subscription.id))?.custom).toBeNull();
  });
});
