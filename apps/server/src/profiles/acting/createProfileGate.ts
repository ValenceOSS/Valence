import { createMiddleware } from 'hono/factory';
import { refuse } from '@ValenceI18n/refuse';
import { isPublicRoute } from '@ValenceServer/auth/isPublicRoute';
import { AUTH_FOR_EVERY_PROFILE } from './AUTH_FOR_EVERY_PROFILE';
import { FOR_THE_OWNER } from './FOR_THE_OWNER';
import { WITHOUT_A_PROFILE } from './WITHOUT_A_PROFILE';
import type { Acting } from './Acting';

/**
 * Whether a request matches one of a list of method and path patterns.
 *
 * @param patterns - What to match against.
 * @param method - The request's method.
 * @param path - The request's path.
 * @returns Whether any pattern matches.
 */
const matchesAny = (
  patterns: readonly { method: string; path: RegExp }[],
  method: string,
  path: string,
): boolean =>
  patterns.some(
    (pattern) => (pattern.method === '*' || pattern.method === method) && pattern.path.test(path),
  );

/**
 * Holds every signed-in request to the profile acting for it: a session that has not chosen a
 * profile reaches only the picker, a profile other than the account's owner is turned away from
 * everything that changes the account itself, and nobody makes API keys behind Valence's back.
 *
 * @param readActing - Who is acting for a request.
 * @returns The middleware.
 */
const createProfileGate = (readActing: (headers: Headers) => Promise<Acting | null>) =>
  createMiddleware(async (context, next) => {
    const { method, path } = context.req;

    if (path.startsWith('/api/auth/api-key/')) {
      return context.json(refuse('error.profiles.keysAreMadeInValence'), 403);
    }

    if (!path.startsWith('/api/auth/') && isPublicRoute(method, path, true)) {
      await next();

      return undefined;
    }

    const acting = await readActing(context.req.raw.headers);

    if (acting === null) {
      await next();

      return undefined;
    }

    if (acting.mustChoose && !matchesAny(WITHOUT_A_PROFILE, method, path)) {
      return context.json(refuse('error.profiles.chooseWhoIsWatching'), 403);
    }

    const isTheOwner = !acting.mustChoose && (acting.profile?.isOwner ?? true);
    const isAccountAuth =
      path.startsWith('/api/auth/') && !AUTH_FOR_EVERY_PROFILE.some((one) => one.test(path));

    if (!isTheOwner && (isAccountAuth || matchesAny(FOR_THE_OWNER, method, path))) {
      return context.json(refuse('error.profiles.onlyTheOwnerCanDoThat'), 403);
    }

    await next();

    return undefined;
  });

export { createProfileGate };
