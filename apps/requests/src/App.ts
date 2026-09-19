import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import type { RequestsStatus, RequestsVpn } from '@ValenceContracts/schemas/Requests';

type CreateAppOptions = {
  secret: string;
  version: string;
  readVpn: () => RequestsVpn;
  isDatabaseUp: () => Promise<boolean>;
};

/**
 * Builds the service's HTTP surface: an open health check for the container runtime, and
 * everything else behind the secret it shares with the Valence server.
 *
 * @param secret - What the server presents as a bearer token.
 * @param version - The release this service is.
 * @param readVpn - The last word on the VPN.
 * @param isDatabaseUp - Whether the database answers.
 * @returns The app.
 */
const createApp = ({ secret, version, readVpn, isDatabaseUp }: CreateAppOptions) => {
  const app = new Hono();

  app.get('/health', async (context) =>
    (await isDatabaseUp())
      ? context.json({ ok: true })
      : context.json({ ok: false, problem: 'The database is not answering' }, 503),
  );

  app.use('/api/*', bearerAuth({ token: secret }));

  app.get('/api/status', (context) =>
    context.json({ version, vpn: readVpn() } satisfies RequestsStatus),
  );

  return app;
};

export type { CreateAppOptions };

export { createApp };
