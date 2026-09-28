import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { AccountProvider } from '@ValenceSDK/manifest/AccountProviderSchema';
import type { AccountTokens } from '@ValenceServer/plugins/broker/createPluginBroker';
import type { PluginStore } from '@ValenceServer/plugins/store/PluginStore';

type Exchange = (
  pluginId: string,
  tokenUrl: string,
  form: Record<string, string>,
) => Promise<{ status: number; text: string }>;

type Credentials = { clientId: string; clientSecret: string | null };

type CreatePluginOAuthOptions = {
  redirectUri: string;
  store: PluginStore;
  seal: (secret: string) => string;
  open: (sealed: string) => string | null;
  exchange: Exchange;
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
  | { ok: false; problem: string; returnTo: string | null };

const TokenAnswerSchema = z.object({
  access_token: z.string().min(1).max(8000),
  refresh_token: z.string().min(1).max(8000).optional(),
  expires_in: z.coerce.number().int().positive().optional(),
});

const PENDING_FOR_MILLISECONDS = 10 * 60 * 1000;

const EARLY_REFRESH_MILLISECONDS = 60 * 1000;

/**
 * Lets somebody connect an outside account — AniList, Spotify — to a plugin, without the plugin
 * ever seeing how. Valence sends them to the provider with a one-off state and a PKCE challenge,
 * takes the code back itself, trades it for tokens from the provider's own token address, and seals
 * the tokens before they are kept. A plugin later asks for the access token of one person it may act
 * for, and gets a fresh one where the old one had expired.
 *
 * The state is bound to a secret kept in the browser that started the connection, so a link to the
 * callback carried to somebody else's browser connects nothing.
 *
 * @param options - Where to come back to, where tokens are kept, how to seal them, and how to reach
 *   a token address.
 * @returns How to begin and finish a connection, and how a plugin reads its tokens.
 */
const createPluginOAuth = ({
  redirectUri,
  store,
  seal,
  open,
  exchange,
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
  ): Promise<z.infer<typeof TokenAnswerSchema> | null> => {
    const answered = await exchange(pluginId, provider.tokenUrl, {
      ...form,
      client_id: credentials.clientId,
      ...(credentials.clientSecret === null ? {} : { client_secret: credentials.clientSecret }),
    });

    if (answered.status < 200 || answered.status >= 300) {
      return null;
    }

    try {
      const read = TokenAnswerSchema.safeParse(JSON.parse(answered.text));

      return read.success ? read.data : null;
    } catch {
      return null;
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

  return {
    begin: (asked: Omit<Pending, 'verifier' | 'expiresAt'>): string => {
      forget();

      const state = random(24).toString('base64url');
      const verifier = random(48).toString('base64url');
      const challenge = createHash('sha256').update(verifier).digest('base64url');
      const address = new URL(asked.provider.authorizeUrl);

      pending.set(state, { ...asked, verifier, expiresAt: now() + PENDING_FOR_MILLISECONDS });
      address.searchParams.set('response_type', 'code');
      address.searchParams.set('client_id', asked.credentials.clientId);
      address.searchParams.set('redirect_uri', redirectUri);
      address.searchParams.set('state', state);
      address.searchParams.set('code_challenge', challenge);
      address.searchParams.set('code_challenge_method', 'S256');

      if (asked.provider.scopes.length > 0) {
        address.searchParams.set('scope', asked.provider.scopes.join(' '));
      }

      return address.toString();
    },
    finish: async (answer: { state: string; code: string; browser: string }): Promise<Finished> => {
      forget();

      const started = pending.get(answer.state);

      if (started === undefined) {
        return { ok: false, problem: 'That connection had expired. Try again.', returnTo: null };
      }

      pending.delete(answer.state);

      if (started.browser !== answer.browser) {
        return {
          ok: false,
          problem: 'That connection was started somewhere else.',
          returnTo: started.returnTo,
        };
      }

      const tokens = await trade(started.pluginId, started.provider, started.credentials, {
        grant_type: 'authorization_code',
        code: answer.code,
        redirect_uri: redirectUri,
        code_verifier: started.verifier,
      });

      if (tokens === null) {
        return {
          ok: false,
          problem: `${started.provider.name} did not accept the connection.`,
          returnTo: started.returnTo,
        };
      }

      await keep(started.pluginId, started.profileId, started.provider.id, tokens, null);

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
      const refresh = kept.refreshToken === null ? null : open(kept.refreshToken);

      if (expired && refresh !== null) {
        const tokens = await trade(pluginId, provider, credentials, {
          grant_type: 'refresh_token',
          refresh_token: refresh,
        });

        if (tokens !== null) {
          await keep(pluginId, profileId, provider.id, tokens, kept.refreshToken);

          return {
            accessToken: tokens.access_token,
            expiresAt:
              tokens.expires_in === undefined
                ? null
                : new Date(now() + tokens.expires_in * 1000).toISOString(),
            account: kept.account,
          };
        }
      }

      if (expired) {
        return null;
      }

      const accessToken = open(kept.accessToken);

      return accessToken === null
        ? null
        : { accessToken, expiresAt: kept.expiresAt, account: kept.account };
    },
  };
};

type PluginOAuth = ReturnType<typeof createPluginOAuth>;

export type { Credentials, PluginOAuth };

export { createPluginOAuth };
