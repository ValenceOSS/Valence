import { z } from 'zod';
import type { Phone } from './NotificationStore';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';

const RENEWS_WITHIN_MS = 7 * 24 * 60 * 60 * 1000;

const CredentialSchema = z.object({
  serverId: z.string(),
  credential: z.string(),
  expiresAt: z.string().datetime(),
});

type Wake = 'sent' | 'gone' | 'failed' | 'off';

type PushRelayOptions = {
  settings: SettingsStore;
  address: string;
  fetch?: typeof globalThis.fetch;
  now?: () => number;
};

/**
 * Wakes this household's phones through Valence's push relay, which holds the keys Apple and Google
 * ask for, so a server run at home can reach a phone without them. The relay is told where to send a
 * push and an opaque delivery identifier, never what the notification says; the phone reads that
 * from this server once woken.
 *
 * Nothing is sent while the server's administrator has the relay turned off. Turned on, the server
 * registers with the relay the first time it needs to and keeps the credential it is handed, renewing
 * it in the week before it runs out and registering afresh where the relay no longer knows it.
 *
 * @param options - The settings the credential is kept in, the relay's address, and how to fetch
 *   and tell the time, so a test need not.
 * @returns A way to wake one phone.
 */
const createPushRelay = ({
  settings,
  address,
  fetch = globalThis.fetch,
  now = Date.now,
}: PushRelayOptions) => {
  let registering: Promise<string | null> | null = null;

  const ask = (path: string, init: RequestInit) =>
    fetch(`${address}${path}`, {
      method: 'POST',
      ...init,
      headers: { 'content-type': 'application/json', ...init.headers },
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null);

  const keep = async (answered: Response | null): Promise<string | null> => {
    const read = CredentialSchema.safeParse(
      answered?.ok === true ? await answered.json().catch(() => null) : null,
    );

    if (!read.success) {
      return null;
    }

    await settings.write({
      pushRelayServerId: read.data.serverId,
      pushRelayCredential: read.data.credential,
      pushRelayCredentialExpiresAt: read.data.expiresAt,
    });

    return read.data.credential;
  };

  const credential = async (isStale: boolean): Promise<string | null> => {
    const held = await settings.read();
    const expiresAt =
      held.pushRelayCredentialExpiresAt === null
        ? 0
        : new Date(held.pushRelayCredentialExpiresAt).getTime();

    if (!isStale && held.pushRelayCredential !== '' && expiresAt - now() > RENEWS_WITHIN_MS) {
      return held.pushRelayCredential;
    }

    registering ??= (async () => {
      const renewed =
        isStale || held.pushRelayCredential === ''
          ? null
          : await keep(
              await ask('/v1/servers/renew', {
                headers: { authorization: `Bearer ${held.pushRelayCredential}` },
              }),
            );

      return renewed ?? keep(await ask('/v1/servers', {}));
    })().finally(() => {
      registering = null;
    });

    return registering;
  };

  const send = async (
    bearer: string,
    phone: Phone,
    deliveryId: string,
    collapseId: string | null,
  ) =>
    ask('/v1/push', {
      headers: { authorization: `Bearer ${bearer}` },
      body: JSON.stringify({
        platform: phone.platform,
        token: phone.token,
        environment: phone.environment,
        deliveryId,
        ...(collapseId === null ? {} : { collapseId }),
      }),
    });

  return {
    wake: async (
      phone: Phone,
      deliveryId: string,
      collapseId: string | null = null,
    ): Promise<Wake> => {
      if (!(await settings.read()).usesPushRelay) {
        return 'off';
      }

      const bearer = await credential(false);
      let answered = bearer === null ? null : await send(bearer, phone, deliveryId, collapseId);

      if (answered?.status === 401) {
        const fresh = await credential(true);

        answered = fresh === null ? null : await send(fresh, phone, deliveryId, collapseId);
      }

      return answered === null
        ? 'failed'
        : answered.ok
          ? 'sent'
          : answered.status === 410
            ? 'gone'
            : 'failed';
    },
  };
};

type PushRelay = ReturnType<typeof createPushRelay>;

export type { PushRelay };

export { createPushRelay };
