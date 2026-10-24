import type { Said } from '@ValenceI18n/SaidSchema';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { AccountProvider } from '@ValenceSDK/manifest/AccountProviderSchema';
import type { AccountTokens } from '@ValenceServer/plugins/broker/createPluginBroker';
import type { ConnectionRecord, PluginStore } from '@ValenceServer/plugins/store/PluginStore';
import { saying } from '@ValenceI18n/saying';

type Exchange = (
  pluginId: string,
  address: string,
  form: Record<string, string>,
) => Promise<{ status: number; text: string }>;

type Credentials = { clientId: string; clientSecret: string | null };

type Lapse = { pluginId: string; profileId: string; provider: AccountProvider };

type CreatePluginOAuthOptions = {
  redirectUri: string;
  store: PluginStore;
  seal: (secret: string) => string;
  open: (sealed: string) => string | null;
  exchange: Exchange;
  onLapse: (lapse: Lapse) => Promise<void>;
  now?: () => number;
  random?: (bytes: number) => Buffer;
};

type Pending = {
  pluginId: string;
  provider: AccountProvider;
  credentials: Credentials;
  verifier: string;
  profileId: string;
  browser: string;
  returnTo: string | null;
  expiresAt: number;
};

type Finished =
  | { ok: true; pluginId: string; profileId: string; provider: string; returnTo: string | null }
  | { ok: false; problem: Said; returnTo: string | null };

const TokenAnswerSchema = z.object({
  access_token: z.string().min(1).max(8000),
  refresh_token: z.string().min(1).max(8000).optional(),
  expires_in: z.coerce.number().int().positive().optional(),
});

const RefusalSchema = z.object({ error: z.enum(['invalid_grant', 'invalid_request']) });

type Traded =
  | { kind: 'tokens'; tokens: z.infer<typeof TokenAnswerSchema> }
  | { kind: 'refused' }
  | { kind: 'failed'; status: number };

const PENDING_FOR_MILLISECONDS = 10 * 60 * 1000;

const EARLY_REFRESH_MILLISECONDS = 60 * 1000;

/**
 * Lets somebody connect an outside account — AniList, Spotify — to a plugin, without the plugin
 * ever seeing how. Valence sends them to the provider with a one-off state and a PKCE challenge,
 * takes the code back itself, trades it for tokens from the provider's own token address, and seals
 * the tokens before they are kept. A plugin later asks for the access token of one person it may
 * act for, and gets a fresh one where the old one had expired, renewed once however many ask at a
 * time. A connection the provider says it won't renew — the grant is no longer good, or
 * MyAnimeList's way of saying so — or one that ran out with nothing to renew it by, is let go and
 * the person told, once, unless it was renewed meanwhile. Any other failed renewal, such as the
 * provider being busy, down, behind a firewall's page, or refusing Valence's own client settings,
 * is a failure for the plugin, never an answer that the person isn't connected. When the plugin
 * goes, Valence asks each provider that has a revocation address to cancel what it gave out.
 *
 * The state is bound to a secret kept in the browser that started the connection, so a link to the
 * callback carried to somebody else's browser connects nothing.
 *
 * @param options - Where to come back to, where tokens are kept, how to seal them, how to reach a
 *   token address, and how to tell somebody their connection was let go.
 * @returns How to begin and finish a connection, and how a plugin reads its tokens.
 */
const createPluginOAuth = ({
  redirectUri,
  store,
  seal,
  open,
  exchange,
  onLapse,
  now = Date.now,
  random = randomBytes,
}: CreatePluginOAuthOptions) => {
  const pending = new Map<string, Pending>();

  const forget = (): void => {
    for (const [state, entry] of pending) {
      if (entry.expiresAt < now()) {
        pending.delete(state);
      }
    }
  };

  const trade = async (
    pluginId: string,
    provider: AccountProvider,
    credentials: Credentials,
    form: Record<string, string>,
  ): Promise<Traded> => {
    const answered = await exchange(pluginId, provider.tokenUrl, {
      ...form,
      client_id: credentials.clientId,
      ...(credentials.clientSecret === null ? {} : { client_secret: credentials.clientSecret }),
    });
    const failed = { kind: 'failed', status: answered.status } as const;

    try {
      if (answered.status >= 200 && answered.status < 300) {
        const read = TokenAnswerSchema.safeParse(JSON.parse(answered.text));

        return read.success ? { kind: 'tokens', tokens: read.data } : failed;
      }

      return (answered.status === 400 || answered.status === 401) &&
        RefusalSchema.safeParse(JSON.parse(answered.text)).success
        ? { kind: 'refused' }
        : failed;
    } catch {
      return failed;
    }
  };

  const keep = async (
    pluginId: string,
    profileId: string,
    provider: string,
    tokens: z.infer<typeof TokenAnswerSchema>,
    previousRefresh: string | null,
  ): Promise<void> => {
    await store.saveConnection({
      pluginId,
      profileId,
      provider,
      accessToken: seal(tokens.access_token),
      refreshToken:
        tokens.refresh_token === undefined ? previousRefresh : seal(tokens.refresh_token),
      expiresAt:
        tokens.expires_in === undefined
          ? null
          : new Date(now() + tokens.expires_in * 1000).toISOString(),
      account: null,
    });
  };

  const renewing = new Map<string, Promise<AccountTokens | null>>();

  const lapse = async (pluginId: string, profileId: string, provider: AccountProvider) => {
    if (await store.forgetConnection(pluginId, profileId, provider.id)) {
      await onLapse({ pluginId, profileId, provider });
    }
  };

  const renew = async (
    pluginId: string,
    provider: AccountProvider,
    credentials: Credentials,
    kept: ConnectionRecord,
  ): Promise<AccountTokens | null> => {
    const refresh = kept.refreshToken === null ? null : open(kept.refreshToken);

    if (refresh === null) {
      await lapse(pluginId, kept.profileId, provider);

      return null;
    }

    const traded = await trade(pluginId, provider, credentials, {
      grant_type: 'refresh_token',
      refresh_token: refresh,
      redirect_uri: redirectUri,
    });

    if (traded.kind === 'failed') {
      throw new Error(
        `${provider.name} could not renew the connection just now (${traded.status.toString()}). Try again later.`,
      );
    }

    if (traded.kind === 'refused') {
      const latest = await store.readConnection(pluginId, kept.profileId, provider.id);

      if (latest !== null && latest.refreshToken !== kept.refreshToken) {
        const accessToken = open(latest.accessToken);

        return accessToken === null
          ? null
          : { accessToken, expiresAt: latest.expiresAt, account: latest.account };
      }

      await lapse(pluginId, kept.profileId, provider);

      return null;
    }

    await keep(pluginId, kept.profileId, provider.id, traded.tokens, kept.refreshToken);

    return {
      accessToken: traded.tokens.access_token,
      expiresAt:
        traded.tokens.expires_in === undefined
          ? null
          : new Date(now() + traded.tokens.expires_in * 1000).toISOString(),
      account: kept.account,
    };
  };

  return {
    begin: (asked: Omit<Pending, 'verifier' | 'expiresAt'>): string => {
      forget();

      const state = random(24).toString('base64url');
      const verifier = random(48).toString('base64url');
      const method = asked.provider.pkce ?? 'S256';
      const challenge =
        method === 'plain' ? verifier : createHash('sha256').update(verifier).digest('base64url');
      const address = new URL(asked.provider.authorizeUrl);

      pending.set(state, { ...asked, verifier, expiresAt: now() + PENDING_FOR_MILLISECONDS });
      address.searchParams.set('response_type', 'code');
      address.searchParams.set('client_id', asked.credentials.clientId);
      address.searchParams.set('redirect_uri', redirectUri);
      address.searchParams.set('state', state);
      address.searchParams.set('code_challenge', challenge);
      address.searchParams.set('code_challenge_method', method);

      if (asked.provider.scopes.length > 0) {
        address.searchParams.set('scope', asked.provider.scopes.join(' '));
      }

      return address.toString();
    },
    finish: async (answer: { state: string; code: string; browser: string }): Promise<Finished> => {
      forget();

      const started = pending.get(answer.state);

      if (started === undefined) {
        return {
          ok: false,
          problem: saying('server.accounts.pluginOAuth.thatConnectionHadExpiredTryAgain'),
          returnTo: null,
        };
      }

      pending.delete(answer.state);

      if (started.browser !== answer.browser) {
        return {
          ok: false,
          problem: saying('server.accounts.pluginOAuth.thatConnectionWasStartedSomewhereElse'),
          returnTo: started.returnTo,
        };
      }

      const tokens = await trade(started.pluginId, started.provider, started.credentials, {
        grant_type: 'authorization_code',
        code: answer.code,
        redirect_uri: redirectUri,
        code_verifier: started.verifier,
      });

      if (tokens.kind !== 'tokens') {
        return {
          ok: false,
          problem: saying('server.accounts.pluginOAuth.nameDidNotAcceptTheConnection', {
            name: started.provider.name,
          }),
          returnTo: started.returnTo,
        };
      }

      await keep(started.pluginId, started.profileId, started.provider.id, tokens.tokens, null);

      return {
        ok: true,
        pluginId: started.pluginId,
        profileId: started.profileId,
        provider: started.provider.id,
        returnTo: started.returnTo,
      };
    },
    tokensFor: async (
      pluginId: string,
      profileId: string,
      provider: AccountProvider,
      credentials: Credentials,
    ): Promise<AccountTokens | null> => {
      const kept = await store.readConnection(pluginId, profileId, provider.id);

      if (kept === null) {
        return null;
      }

      const expired =
        kept.expiresAt !== null && Date.parse(kept.expiresAt) - EARLY_REFRESH_MILLISECONDS < now();

      if (!expired) {
        const accessToken = open(kept.accessToken);

        return accessToken === null
          ? null
          : { accessToken, expiresAt: kept.expiresAt, account: kept.account };
      }

      const key = JSON.stringify([pluginId, profileId, provider.id]);
      const running = renewing.get(key);

      if (running !== undefined) {
        return running;
      }

      const started = renew(pluginId, provider, credentials, kept).finally(() => {
        renewing.delete(key);
      });

      renewing.set(key, started);

      return started;
    },
    revoke: async (
      connection: ConnectionRecord,
      provider: AccountProvider,
      credentials: Credentials,
    ): Promise<boolean> => {
      const refresh = connection.refreshToken === null ? null : open(connection.refreshToken);
      const token = refresh ?? open(connection.accessToken);

      if (provider.revokeUrl === undefined || token === null) {
        return false;
      }

      try {
        const answered = await exchange(connection.pluginId, provider.revokeUrl, {
          token,
          token_type_hint: refresh === null ? 'access_token' : 'refresh_token',
          client_id: credentials.clientId,
          ...(credentials.clientSecret === null ? {} : { client_secret: credentials.clientSecret }),
        });

        return answered.status >= 200 && answered.status < 300;
      } catch {
        return false;
      }
    },
  };
};

type PluginOAuth = ReturnType<typeof createPluginOAuth>;

export type { Credentials, Lapse, PluginOAuth };

export { createPluginOAuth };
