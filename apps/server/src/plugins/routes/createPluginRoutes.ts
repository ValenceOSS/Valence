import { randomBytes, randomUUID } from 'node:crypto';
import { RouteAnswerSchema } from '@ValenceSDK/routes/RouteAnswerSchema';
import type { Serve } from '@ValenceSDK/routes/RouteAnswerSchema';
import type { RouteRequest } from '@ValenceSDK/host/PluginDefinition';
import type { RouteSignIn } from '@ValenceSDK/manifest/RouteSignInSchema';
import type { BrokerScope } from '@ValenceServer/plugins/broker/BrokerScope';
import type {
  CredentialRecord,
  InstalledRecord,
  PluginStore,
} from '@ValenceServer/plugins/store/PluginStore';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { checkRouteSignIn } from './checkRouteSignIn';
import { hashOfSecret } from './hashOfSecret';
import { routesTakingAppPasswords } from './routesTakingAppPasswords';
import { callerKeyOf } from './callerKeyOf';
import { fitsInWindow } from './fitsInWindow';
import { loginFrom } from './loginFrom';
import { sweepWindows } from './sweepWindows';

type Runnable = { record: InstalledRecord; code: string };

type CreatePluginRoutesOptions = {
  runnable: (pluginId: string) => Promise<Runnable | null>;
  store: Pick<
    PluginStore,
    | 'saveCredential'
    | 'credentialsOf'
    | 'credentialByLogin'
    | 'credentialBySecret'
    | 'forgetCredential'
    | 'touchCredential'
    | 'rememberProfile'
  >;
  invoke: (plugin: Runnable, args: object, scope: BrokerScope) => Promise<string>;
  readProfile: (
    profileId: string,
  ) => Promise<{ id: string; name: string; accountId: string } | null>;
  viewerOf: (profileId: string) => Promise<Viewer>;
  seal: (secret: string) => string;
  open: (sealed: string) => string | null;
  log: (level: 'info' | 'warn' | 'error', message: string) => void;
  now?: () => number;
};

type RouteAsk = {
  method: string;
  path: string;
  query: Record<string, string[]>;
  headers: Record<string, string>;
  body: string;
  address: string | null;
};

type RouteOutcome =
  | {
      kind: 'answered';
      status: number;
      contentType: string;
      body: string;
      cacheSeconds: number | null;
    }
  | { kind: 'serve'; serve: Serve; viewer: Viewer }
  | { kind: 'unknown' }
  | { kind: 'wrongMethod'; allowed: readonly string[] }
  | { kind: 'signInNeeded'; realm: string | null }
  | { kind: 'limited'; retryAfterSeconds: number }
  | { kind: 'failed' };

type CredentialSummary = Pick<
  CredentialRecord,
  'id' | 'login' | 'label' | 'createdAt' | 'lastUsedAt'
>;

const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

const HEADERS_PASSED_ON = new Set([
  'accept',
  'accept-language',
  'content-type',
  'if-modified-since',
  'if-none-match',
  'range',
  'user-agent',
]);

const WINDOW_MILLISECONDS = 60_000;

const MOST_PER_CREDENTIAL = 1200;

const MOST_FROM_NOBODY = 120;

const FAILURE_WINDOW_MILLISECONDS = 10 * 60_000;

const MOST_FAILURES = 20;

const TOUCH_EVERY_MILLISECONDS = 5 * 60_000;

const MOST_CREDENTIALS = 20;

const SWEEP_EVERY = 500;

const MOST_LOGIN_TRIES = 50;

/**
 * The routes plugins answer for apps outside Valence, signed in with the app passwords people make
 * for them.
 *
 * @param options - How to run plugins and keep credentials.
 * @returns How to answer a request, and how to list, make and forget credentials.
 */
const createPluginRoutes = ({
  runnable,
  store,
  invoke,
  readProfile,
  viewerOf,
  seal,
  open,
  log,
  now = Date.now,
}: CreatePluginRoutesOptions) => {
  const requested = new Map<string, number[]>();
  const failed = new Map<string, number[]>();
  const touched = new Map<string, number>();
  let answered = 0;

  const sweepNow = (at: number): void => {
    sweepWindows(requested, WINDOW_MILLISECONDS, at);
    sweepWindows(failed, FAILURE_WINDOW_MILLISECONDS, at);

    for (const [key, moment] of touched) {
      if (at - moment >= TOUCH_EVERY_MILLISECONDS) {
        touched.delete(key);
      }
    }
  };

  const routesOf = (record: InstalledRecord) =>
    record.manifest.permissions.some((permission) => permission.kind === 'routes')
      ? record.manifest.contributes.routes
      : [];

  const secretParameters = (signIns: readonly RouteSignIn[]): Set<string> =>
    new Set(
      signIns.flatMap((signIn) => {
        switch (signIn.kind) {
          case 'query':
            return [signIn.secret];
          case 'saltedMd5':
            return [signIn.token, signIn.salt];
          case 'bearer':
          case 'basic':
          case 'public':
            return [];
        }
      }),
    );

  const answer = async (
    pluginId: string,
    routeId: string,
    ask: RouteAsk,
  ): Promise<RouteOutcome> => {
    const at = now();
    const found = await runnable(pluginId);
    const route =
      found === null ? undefined : routesOf(found.record).find((each) => each.id === routeId);

    if (found === null || route === undefined) {
      return { kind: 'unknown' };
    }

    answered += 1;

    if (answered % SWEEP_EVERY === 0) {
      sweepNow(at);
    }

    const asked = ask.method.toUpperCase();
    const method = asked === 'HEAD' ? 'GET' : asked;

    if (!METHODS.has(method) || !route.methods.some((each) => each === method)) {
      return { kind: 'wrongMethod', allowed: route.methods };
    }

    const address = callerKeyOf(ask.address);
    const isForm = (ask.headers['content-type'] ?? '')
      .toLowerCase()
      .startsWith('application/x-www-form-urlencoded');
    const form: Record<string, string[]> = {};

    if (isForm) {
      for (const [name, value] of new URLSearchParams(ask.body)) {
        form[name] = [...(form[name] ?? []), value];
      }
    }

    const signedIn = await checkRouteSignIn(
      route.signIn,
      {
        authorization: ask.headers.authorization ?? null,
        query: Object.fromEntries(
          [...new Set([...Object.keys(ask.query), ...Object.keys(form)])].map((name) => [
            name,
            [...(ask.query[name] ?? []), ...(form[name] ?? [])],
          ]),
        ),
      },
      {
        byLogin: (login) => store.credentialByLogin(pluginId, login),
        bySecret: (secretHash) => store.credentialBySecret(pluginId, secretHash),
        open,
      },
    );

    const person =
      signedIn.kind === 'person' ? await readProfile(signedIn.credential.profileId) : null;

    if (
      signedIn.kind === 'refused' ||
      signedIn.kind === 'missing' ||
      (signedIn.kind === 'person' && person === null)
    ) {
      return fitsInWindow(failed, address, MOST_FAILURES, FAILURE_WINDOW_MILLISECONDS, at)
        ? {
            kind: 'signInNeeded',
            realm: route.signIn.some((each) => each.kind === 'basic')
              ? found.record.manifest.name
              : null,
          }
        : { kind: 'limited', retryAfterSeconds: FAILURE_WINDOW_MILLISECONDS / 1000 };
    }

    const limitKey =
      person === null
        ? `nobody:${address}`
        : `credential:${signedIn.kind === 'person' ? signedIn.credential.id : ''}`;

    if (
      !fitsInWindow(
        requested,
        `${pluginId}:${limitKey}`,
        person === null ? MOST_FROM_NOBODY : MOST_PER_CREDENTIAL,
        WINDOW_MILLISECONDS,
        at,
      )
    ) {
      return { kind: 'limited', retryAfterSeconds: WINDOW_MILLISECONDS / 1000 };
    }

    if (
      signedIn.kind === 'person' &&
      at - (touched.get(signedIn.credential.id) ?? 0) > TOUCH_EVERY_MILLISECONDS
    ) {
      touched.set(signedIn.credential.id, at);
      await store.touchCredential(signedIn.credential.id, new Date(at).toISOString());
    }

    const hidden = secretParameters(route.signIn);
    const request: RouteRequest = {
      method:
        method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'
          ? method
          : 'GET',
      path: ask.path,
      query: Object.fromEntries(Object.entries(ask.query).filter(([name]) => !hidden.has(name))),
      headers: Object.fromEntries(
        Object.entries(ask.headers).filter(([name]) => HEADERS_PASSED_ON.has(name.toLowerCase())),
      ),
      body: isForm
        ? new URLSearchParams(
            Object.entries(form).flatMap(([name, values]) =>
              hidden.has(name) ? [] : values.map((value): [string, string] => [name, value]),
            ),
          ).toString()
        : ask.body,
      receivedAt: new Date(at).toISOString(),
    };
    const viewer = person === null ? null : await viewerOf(person.id);
    const scope: BrokerScope =
      person === null || viewer === null
        ? { kind: 'nobody' }
        : {
            kind: 'viewer',
            profileId: person.id,
            accountId: person.accountId,
            isAdmin: false,
            reads: viewer,
          };

    try {
      const text = await invoke(
        found,
        {
          id: routeId,
          person: person === null ? null : { profileId: person.id, name: person.name },
          request,
        },
        scope,
      );
      const read = RouteAnswerSchema.safeParse(JSON.parse(text));

      if (!read.success) {
        log(
          'warn',
          `plugin ${pluginId}: route ${routeId} answered with something Valence cannot send`,
        );

        return { kind: 'failed' };
      }

      if ('serve' in read.data) {
        if (viewer === null) {
          log('warn', `plugin ${pluginId}: route ${routeId} asked to serve something for nobody`);

          return { kind: 'failed' };
        }

        return { kind: 'serve', serve: read.data.serve, viewer };
      }

      return {
        kind: 'answered',
        status: read.data.status,
        contentType: read.data.contentType,
        body: read.data.body,
        cacheSeconds: read.data.cacheSeconds ?? null,
      };
    } catch (error) {
      log(
        'warn',
        `plugin ${pluginId}: route ${routeId} failed: ${error instanceof Error ? error.message : 'failed'}`,
      );

      return { kind: 'failed' };
    }
  };

  const summary = (credential: CredentialRecord): CredentialSummary => ({
    id: credential.id,
    login: credential.login,
    label: credential.label,
    createdAt: credential.createdAt,
    lastUsedAt: credential.lastUsedAt,
  });

  const appRoutesOf = async (pluginId: string) => {
    const found = await runnable(pluginId);

    return found === null ? [] : routesTakingAppPasswords(found.record);
  };

  return {
    answer,
    credentialsOf: async (pluginId: string, profileId: string) => {
      const routes = await appRoutesOf(pluginId);

      return routes.length === 0
        ? null
        : {
            routes: routes.map((route) => ({ id: route.id, title: route.title })),
            credentials: (await store.credentialsOf(pluginId, profileId)).map(summary),
          };
    },
    makeCredential: async (
      pluginId: string,
      profile: { id: string; name: string },
      label: string,
    ): Promise<{ credential: CredentialSummary; secret: string } | 'unknown' | 'tooMany'> => {
      if ((await appRoutesOf(pluginId)).length === 0) {
        return 'unknown';
      }

      if ((await store.credentialsOf(pluginId, profile.id)).length >= MOST_CREDENTIALS) {
        return 'tooMany';
      }

      const base = loginFrom(profile.name) || 'valence';

      for (let tries = 1; tries <= MOST_LOGIN_TRIES; tries += 1) {
        const login = tries === 1 ? base : `${base}-${tries.toString()}`;

        if ((await store.credentialByLogin(pluginId, login)) !== null) {
          continue;
        }

        const secret = randomBytes(18).toString('base64url');
        const credential: CredentialRecord = {
          id: randomUUID(),
          pluginId,
          profileId: profile.id,
          login,
          label,
          secretHash: hashOfSecret(secret),
          sealedSecret: seal(secret),
          createdAt: new Date(now()).toISOString(),
          lastUsedAt: null,
        };

        try {
          await store.saveCredential(credential);
        } catch {
          continue;
        }

        await store.rememberProfile(pluginId, profile.id);

        return { credential: summary(credential), secret };
      }

      return 'tooMany';
    },
    forgetCredential: (pluginId: string, profileId: string, credentialId: string) =>
      store.forgetCredential(pluginId, profileId, credentialId),
  };
};

type PluginRoutes = ReturnType<typeof createPluginRoutes>;

export type { CredentialSummary, PluginRoutes, RouteAsk, RouteOutcome };

export { createPluginRoutes };
