import { betterAuth } from 'better-auth';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { z } from 'zod';
import type { DBAdapter, DBAdapterInstance } from 'better-auth';
import type { SignInAttempt } from '@ValenceServer/auth/describeSignInAttempt';
import { brandsOf } from '@ValenceServer/web/brandsOf';
import { CALLER_HEADER } from '@ValenceServer/web/CALLER_HEADER';
import { setSessionCookie } from 'better-auth/cookies';
import { bearerWithoutACookie } from '@ValenceServer/auth/bearerWithoutACookie';
import { confirmItIsYou } from '@ValenceServer/auth/confirmItIsYou';
import { finishSetup } from '@ValenceServer/auth/finishSetup';
import {
  admin,
  deviceAuthorization,
  genericOAuth,
  jwt,
  oneTimeToken,
  openAPI,
  twoFactor,
  username,
} from 'better-auth/plugins';
import { apiKey } from '@better-auth/api-key';
import { passkey } from '@better-auth/passkey';
import { trustedOriginsFor } from '@ValenceServer/auth/trustedOriginsFor';
import type { Env } from '@ValenceServer/env/Env';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import { PASSWORD_RESET_LIFETIME_SECONDS } from '@ValenceServer/auth/PASSWORD_RESET_LIFETIME_SECONDS';
import { MINIMUM_USERNAME_LENGTH } from '@ValenceContracts/constants/MINIMUM_USERNAME_LENGTH';
import { MAXIMUM_USERNAME_LENGTH } from '@ValenceContracts/constants/MAXIMUM_USERNAME_LENGTH';
import { signInTheDemo } from '@ValenceServer/auth/signInTheDemo';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';

type AuthDatabase = DBAdapter | DBAdapterInstance;

type CreateAuthOptions = {
  env: Env;
  database: AuthDatabase;
  settings: SettingsStore;
  cookieSecure: boolean;
  onUserCreated?: (userId: string) => Promise<void>;
  onUserChanged?: (userId: string) => Promise<void>;
  onSignedIn?: (userId: string, at: Date) => Promise<void>;
  onPasswordResetRequested?: (email: string, url: string, name: string) => Promise<void>;
  onSignInSettled?: (attempt: SignInAttempt) => void;
};

const IdentifierSchema = z
  .object({ email: z.string().optional(), username: z.string().optional() })
  .partial();

const RefusalSchema = z.instanceof(APIError);

// oxlint-disable-next-line valence/no-hard-coded-strings -- the product's name
const VALENCE_APP_NAME = 'Valence';

const DEVICE_TOKEN_PATH = '/device/token';

/**
 * Builds the authentication layer: accounts, sessions, cookies, password resets and API keys, wired
 * to Valence's own database and settings. Everything about who somebody is comes from here rather than
 * being reimplemented per route.
 *
 * A television signed in from a phone is let in both ways a client can carry a session. The grant's
 * answer is only a token, so the session cookie is set beside it for a television that is a browser,
 * and the token itself is accepted as a bearer for one that is an app and keeps no cookies of its
 * own. Without either, a television that finished signing in was left on the sign-in screen.
 *
 * @param options - The environment, the database, the settings store, whether cookies are secure,
 * and the hooks fired when an account is made or changed, signs in, or asks for a reset.
 * @returns The authentication layer.
 */
const createAuth = ({
  env,
  database,
  settings,
  cookieSecure,
  onUserCreated,
  onUserChanged,
  onSignedIn,
  onPasswordResetRequested,
  onSignInSettled,
}: CreateAuthOptions) => {
  return betterAuth({
    appName: VALENCE_APP_NAME,
    database,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: trustedOriginsFor({
      configured: env.TRUSTED_ORIGINS,
      port: env.PORT,
      settings,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MINIMUM_PASSWORD_LENGTH,
      resetPasswordTokenExpiresIn: PASSWORD_RESET_LIFETIME_SECONDS,
      sendResetPassword: async ({ user, url }) => {
        await onPasswordResetRequested?.(user.email, url, user.name);
      },
    },
    advanced: {
      useSecureCookies: cookieSecure,
      ipAddress: { ipAddressHeaders: [CALLER_HEADER] },
      defaultCookieAttributes: {
        sameSite: 'lax',
        secure: cookieSecure,
        httpOnly: true,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    databaseHooks: {
      user: {
        create: {
          after: async (created) => {
            await onUserCreated?.(created.id);
          },
        },
        update: {
          after: async (changed) => {
            await onUserChanged?.(changed.id);
          },
        },
      },
      session: {
        create: {
          after: async (created) => {
            await onSignedIn?.(created.userId, new Date());
          },
        },
      },
    },
    hooks: {
      after: createAuthMiddleware(async (context) => {
        const session = context.context.newSession;

        if (context.path === DEVICE_TOKEN_PATH && session !== null) {
          await setSessionCookie(context, session);
        }

        if (onSignInSettled === undefined) {
          return;
        }

        const refusal = RefusalSchema.safeParse(context.context.returned);
        const identifier = IdentifierSchema.safeParse(context.body);

        onSignInSettled({
          path: context.path,
          statusCode: refusal.success ? refusal.data.statusCode : null,
          account: session === null ? null : { id: session.user.id, name: session.user.name },
          identifier: identifier.success
            ? (identifier.data.email ?? identifier.data.username ?? null)
            : null,
          userAgent: context.headers?.get('user-agent') ?? null,
          brands: brandsOf(context.headers?.get('sec-ch-ua')),
          address: context.headers?.get(CALLER_HEADER) ?? null,
        });

        await Promise.resolve();
      }),
    },
    rateLimit: {
      enabled: env.AUTH_RATE_LIMIT_ENABLED,
      window: env.AUTH_RATE_LIMIT_WINDOW_SECONDS,
      max: env.AUTH_RATE_LIMIT_MAX,
    },
    plugins: [
      twoFactor({ issuer: VALENCE_APP_NAME }),
      passkey({ rpName: VALENCE_APP_NAME }),
      confirmItIsYou(),
      finishSetup(),
      signInTheDemo(),
      deviceAuthorization({ expiresIn: '10m', interval: '5s' }),
      bearerWithoutACookie(),
      jwt(),
      oneTimeToken({ disableClientRequest: true, storeToken: 'hashed', expiresIn: 3 }),
      apiKey({ enableSessionForAPIKeys: true }),
      admin(),
      username({
        minUsernameLength: MINIMUM_USERNAME_LENGTH,
        maxUsernameLength: MAXIMUM_USERNAME_LENGTH,
      }),
      genericOAuth({ config: [] }),
      openAPI({ disableDefaultReference: true }),
    ],
  });
};

type ValenceAuth = ReturnType<typeof createAuth>;

export type { ValenceAuth };

export { createAuth };
