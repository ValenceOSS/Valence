import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryNotificationStore } from './createMemoryNotificationStore';
import { notifyHousehold } from './notifyHousehold';
import type { NotificationStore } from './NotificationStore';
import type { WebPushSender } from './sendWebPush';
import { createPushDeliveries } from './createPushDeliveries';
import type { PushRelay } from './createPushRelay';

const keys = { publicKey: 'public', privateKey: 'private' };

const news = {
  event: 'media.added' as const,
  title: sayVerbatim('Something new to watch'),
  body: sayVerbatim('12 episodes — The Office'),
  link: '/?show=s1',
};

let store: NotificationStore;

beforeEach(() => {
  store = createMemoryNotificationStore({
    listAccountIds: () => Promise.resolve(['alice', 'bob']),
  });
});

const landing = () => vi.fn<WebPushSender>().mockResolvedValue({ statusCode: 201 });

describe('notifyHousehold', () => {
  it('tells everybody in-app, which is on by default', async () => {
    await notifyHousehold({ store, ...news, vapid: keys, send: landing() });

    expect(await store.countUnread({ userId: 'alice', profileId: null })).toBe(1);
    expect(await store.countUnread({ userId: 'bob', profileId: null })).toBe(1);
  });

  it('does not push at somebody who never asked to be interrupted', async () => {
    const send = landing();

    await store.addPushEndpoint('alice', { endpoint: 'https://push/1', p256dh: 'k', auth: 'a' });

    await notifyHousehold({ store, ...news, vapid: keys, send });

    expect(send).not.toHaveBeenCalled();
  });

  it('pushes to somebody who asked', async () => {
    const send = landing();

    await store.writePreference('alice', { event: 'media.added', inApp: true, push: true });
    await store.addPushEndpoint('alice', { endpoint: 'https://push/1', p256dh: 'k', auth: 'a' });

    await notifyHousehold({ store, ...news, vapid: keys, send });

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('reaches every browser one person uses', async () => {
    const send = landing();

    await store.writePreference('alice', { event: 'media.added', inApp: true, push: true });
    await store.addPushEndpoint('alice', { endpoint: 'https://push/1', p256dh: 'k', auth: 'a' });
    await store.addPushEndpoint('alice', { endpoint: 'https://push/2', p256dh: 'k', auth: 'a' });

    await notifyHousehold({ store, ...news, vapid: keys, send });

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('still tells the bell on a server with no push keys', async () => {
    const send = landing();

    await notifyHousehold({ store, ...news, vapid: null, send });

    expect(await store.countUnread({ userId: 'alice', profileId: null })).toBe(1);
    expect(send).not.toHaveBeenCalled();
  });

  it('forgets a browser the push service says is gone', async () => {
    const send = vi
      .fn<WebPushSender>()
      .mockRejectedValue(Object.assign(new Error('gone'), { statusCode: 410 }));

    await store.writePreference('alice', { event: 'media.added', inApp: true, push: true });
    await store.addPushEndpoint('alice', { endpoint: 'https://push/1', p256dh: 'k', auth: 'a' });

    await notifyHousehold({ store, ...news, vapid: keys, send });

    expect(await store.listPushEndpoints('alice')).toStrictEqual([]);
  });

  it('keeps a browser whose push service was merely having a bad day', async () => {
    const send = vi
      .fn<WebPushSender>()
      .mockRejectedValue(Object.assign(new Error('later'), { statusCode: 503 }));

    await store.writePreference('alice', { event: 'media.added', inApp: true, push: true });
    await store.addPushEndpoint('alice', { endpoint: 'https://push/1', p256dh: 'k', auth: 'a' });

    await notifyHousehold({ store, ...news, vapid: keys, send });

    expect(await store.listPushEndpoints('alice')).toHaveLength(1);
  });

  it('does not fail the scan that found the media when the store is down', async () => {
    const broken: NotificationStore = {
      ...store,
      listWanting: () => Promise.reject(new Error('the database went away')),
    };
    const onProblem = vi.fn();

    await expect(
      notifyHousehold({ store: broken, ...news, vapid: keys, onProblem }),
    ).resolves.toBeUndefined();

    expect(onProblem).toHaveBeenCalledWith('the database went away');
  });

  it('leaves somebody who turned in-app off out of it', async () => {
    await store.writePreference('alice', { event: 'media.added', inApp: false, push: false });

    await notifyHousehold({ store, ...news, vapid: keys, send: landing() });

    expect(await store.countUnread({ userId: 'alice', profileId: null })).toBe(0);
    expect(await store.countUnread({ userId: 'bob', profileId: null })).toBe(1);
  });

  it('tells only the person it was meant for', async () => {
    await notifyHousehold({ store, ...news, vapid: null, only: ['bob'] });

    expect(await store.countUnread({ userId: 'bob', profileId: null })).toBe(1);
    expect(await store.countUnread({ userId: 'alice', profileId: null })).toBe(0);
  });

  it('leaves out somebody who hears of it another way', async () => {
    await notifyHousehold({ store, ...news, vapid: null, except: ['bob'] });

    expect(await store.countUnread({ userId: 'alice', profileId: null })).toBe(1);
    expect(await store.countUnread({ userId: 'bob', profileId: null })).toBe(0);
  });

  it('still lets somebody decide they do not want to hear it', async () => {
    await store.writePreference('bob', { event: 'media.added', inApp: false, push: false });
    await notifyHousehold({ store, ...news, vapid: null, only: ['bob'] });

    expect(await store.countUnread({ userId: 'bob', profileId: null })).toBe(0);
  });

  it('announces only the people it actually reached', async () => {
    const announced: string[][] = [];

    await notifyHousehold({
      store,
      ...news,
      vapid: null,
      only: ['bob'],
      announce: (userIds) => {
        announced.push([...userIds]);
      },
    });

    expect(announced).toEqual([['bob']]);
  });

  it('tells only the profiles on an account it concerns', async () => {
    await notifyHousehold({
      store,
      ...news,
      vapid: null,
      profilesOf: new Map([['alice', ['kid']]]),
    });

    expect(await store.countUnread({ userId: 'alice', profileId: 'kid' })).toBe(1);
    expect(await store.countUnread({ userId: 'alice', profileId: 'parent' })).toBe(0);
    expect(await store.countUnread({ userId: 'alice', profileId: null })).toBe(0);
  });

  it('still tells every profile on an account it names no profiles for', async () => {
    await notifyHousehold({
      store,
      ...news,
      vapid: null,
      profilesOf: new Map([['alice', ['kid']]]),
    });

    expect(await store.countUnread({ userId: 'bob', profileId: 'anybody' })).toBe(1);
    expect(await store.countUnread({ userId: 'bob', profileId: null })).toBe(1);
  });

  it('tells each of several profiles on an account once', async () => {
    await notifyHousehold({
      store,
      ...news,
      vapid: null,
      profilesOf: new Map([['alice', ['kid', 'parent']]]),
    });

    expect(await store.countUnread({ userId: 'alice', profileId: 'kid' })).toBe(1);
    expect(await store.countUnread({ userId: 'alice', profileId: 'parent' })).toBe(1);
  });

  it('treats an empty list of profiles as the whole account', async () => {
    await notifyHousehold({ store, ...news, vapid: null, profilesOf: new Map([['alice', []]]) });

    expect(await store.countUnread({ userId: 'alice', profileId: 'kid' })).toBe(1);
  });

  it('pushes to the account’s devices once, however many of its profiles it concerns', async () => {
    const send = landing();

    await store.writePreference('alice', { event: 'media.added', inApp: true, push: true });
    await store.addPushEndpoint('alice', { endpoint: 'https://push/1', p256dh: 'k', auth: 'a' });

    await notifyHousehold({
      store,
      ...news,
      vapid: keys,
      send,
      profilesOf: new Map([['alice', ['kid', 'parent']]]),
    });

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('announces an account once, however many of its profiles it told', async () => {
    const announced: string[][] = [];

    await notifyHousehold({
      store,
      ...news,
      vapid: null,
      only: ['alice'],
      profilesOf: new Map([['alice', ['kid', 'parent']]]),
      announce: (userIds) => {
        announced.push([...userIds]);
      },
    });

    expect(announced).toEqual([['alice']]);
  });

  describe('phones', () => {
    const IPHONE = {
      platform: 'apple' as const,
      token: 'a'.repeat(64),
      environment: 'production' as const,
    };

    /**
     * A relay for a test, answering every wake the same way.
     *
     * @param answer - What waking a phone answers.
     * @returns The relay.
     */
    const aRelay = (answer: Awaited<ReturnType<PushRelay['wake']>> = 'sent') => ({
      wake: vi.fn<PushRelay['wake']>(() => Promise.resolve(answer)),
    });

    it('wakes the phone of somebody who asked for push, keeping what it says for the phone to read', async () => {
      const relay = aRelay();
      const deliveries = createPushDeliveries();

      await store.writePreference('alice', { event: 'media.added', inApp: true, push: true });
      await store.addPhone({ userId: 'alice', profileId: null }, IPHONE);

      await notifyHousehold({ store, ...news, vapid: null, phones: { relay, deliveries } });

      const [phone, deliveryId] = relay.wake.mock.calls[0] ?? [];

      expect(phone?.token).toBe(IPHONE.token);
      expect(deliveries.read(deliveryId ?? '', { userId: 'alice', profileId: null })?.body).toEqual(
        news.body,
      );
      expect(deliveries.read(deliveryId ?? '', { userId: 'bob', profileId: null })).toBeNull();
    });

    it('wakes only the phone signed in as the profile it is for', async () => {
      const relay = aRelay();

      await store.writePreference('alice', { event: 'media.added', inApp: true, push: true });
      await store.addPhone({ userId: 'alice', profileId: 'asker' }, IPHONE);
      await store.addPhone(
        { userId: 'alice', profileId: 'child' },
        { ...IPHONE, token: 'b'.repeat(64) },
      );

      await notifyHousehold({
        store,
        ...news,
        vapid: null,
        phones: { relay, deliveries: createPushDeliveries() },
        profilesOf: new Map([['alice', ['asker']]]),
      });

      expect(relay.wake.mock.calls.map(([phone]) => phone.token)).toEqual([IPHONE.token]);
    });

    it('forgets a phone the relay says is gone', async () => {
      await store.writePreference('alice', { event: 'media.added', inApp: true, push: true });
      await store.addPhone({ userId: 'alice', profileId: null }, IPHONE);

      await notifyHousehold({
        store,
        ...news,
        vapid: null,
        phones: { relay: aRelay('gone'), deliveries: createPushDeliveries() },
      });

      expect(await store.listPhones('alice')).toEqual([]);
    });
  });
});
