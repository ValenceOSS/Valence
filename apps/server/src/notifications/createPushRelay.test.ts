import { describe, expect, it, vi } from 'vitest';
import { ServerSettingsSchema } from '@ValenceServer/settings/ServerSettings';
import { createMemorySettingsStore } from '@ValenceServer/settings/createMemorySettingsStore';
import { createPushRelay } from './createPushRelay';
import type { Phone } from './NotificationStore';

const PHONE: Phone = {
  platform: 'apple',
  token: 'a'.repeat(64),
  environment: 'production',
  profileId: null,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Settings for a test, with the relay turned on or off.
 *
 * @param usesPushRelay - Whether it is on.
 * @returns The settings.
 */
const settingsWith = (usesPushRelay: boolean) =>
  createMemorySettingsStore(
    ServerSettingsSchema.parse({
      trustedOrigins: [],
      cookieSecure: false,
      setupCompletedAt: null,
      usesPushRelay,
    }),
  );

/**
 * Where a request was sent.
 *
 * @param address - What fetch was handed.
 * @returns The address.
 */
const addressOf = (address: string | URL | Request): string =>
  typeof address === 'string' ? address : address instanceof URL ? address.href : address.url;

/**
 * A relay for a test, answering each address as the test says.
 *
 * @param answers - What each address answers.
 * @returns The fetch.
 */
const aRelay = (answers: Record<string, () => Response>) =>
  vi.fn<typeof fetch>((address) =>
    Promise.resolve(
      (
        answers[new URL(addressOf(address)).pathname] ?? (() => new Response(null, { status: 404 }))
      )(),
    ),
  );

const REGISTERED = () =>
  Response.json({
    serverId: 'server',
    credential: 'credential',
    expiresAt: new Date(90 * DAY_MS).toISOString(),
  });

describe('createPushRelay', () => {
  it('sends nothing at all while the administrator has it off', async () => {
    const fetch = aRelay({});
    const relay = createPushRelay({
      settings: settingsWith(false),
      address: 'https://relay',
      fetch,
    });

    expect(await relay.wake(PHONE, 'd')).toBe('off');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('registers the first time, keeps the credential, and sends only where and which delivery', async () => {
    const settings = settingsWith(true);
    const fetch = aRelay({
      '/v1/servers': REGISTERED,
      '/v1/push': () => Response.json({ status: 'sent' }),
    });
    const relay = createPushRelay({ settings, address: 'https://relay', fetch, now: () => 0 });

    expect(await relay.wake(PHONE, 'delivery')).toBe('sent');
    expect(await relay.wake(PHONE, 'again')).toBe('sent');

    const pushes = fetch.mock.calls.filter(([address]) => addressOf(address).endsWith('/v1/push'));
    const sent = pushes[0]?.[1]?.body;

    expect(
      fetch.mock.calls.filter(([address]) => addressOf(address).endsWith('/v1/servers')),
    ).toHaveLength(1);
    expect(JSON.parse(typeof sent === 'string' ? sent : '')).toEqual({
      platform: 'apple',
      token: PHONE.token,
      environment: 'production',
      deliveryId: 'delivery',
    });
    expect((await settings.read()).pushRelayCredential).toBe('credential');
  });

  it('renews a credential in the week before it runs out', async () => {
    const settings = settingsWith(true);

    await settings.write({
      pushRelayCredential: 'old',
      pushRelayCredentialExpiresAt: new Date(3 * DAY_MS).toISOString(),
    });

    const fetch = aRelay({
      '/v1/servers/renew': REGISTERED,
      '/v1/push': () => Response.json({ status: 'sent' }),
    });

    await createPushRelay({ settings, address: 'https://relay', fetch, now: () => 0 }).wake(
      PHONE,
      'd',
    );

    expect((await settings.read()).pushRelayCredential).toBe('credential');
  });

  it('registers afresh where the relay no longer knows it', async () => {
    const settings = settingsWith(true);

    await settings.write({
      pushRelayCredential: 'forgotten',
      pushRelayCredentialExpiresAt: new Date(60 * DAY_MS).toISOString(),
    });

    let pushes = 0;
    const fetch = aRelay({
      '/v1/servers': REGISTERED,
      '/v1/push': () => {
        pushes += 1;

        return pushes === 1
          ? new Response(null, { status: 401 })
          : Response.json({ status: 'sent' });
      },
    });

    expect(
      await createPushRelay({ settings, address: 'https://relay', fetch, now: () => 0 }).wake(
        PHONE,
        'd',
      ),
    ).toBe('sent');
  });

  it('says a phone is gone where the relay says so', async () => {
    const fetch = aRelay({
      '/v1/servers': REGISTERED,
      '/v1/push': () => new Response(null, { status: 410 }),
    });

    expect(
      await createPushRelay({
        settings: settingsWith(true),
        address: 'https://relay',
        fetch,
        now: () => 0,
      }).wake(PHONE, 'd'),
    ).toBe('gone');
  });
});
