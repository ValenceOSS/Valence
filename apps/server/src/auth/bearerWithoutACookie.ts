import { bearer } from 'better-auth/plugins';

const A_SESSION_COOKIE = /(?:^|;\s*)(?:__Secure-)?[\w.-]*session_token=/u;

type Asked = { request?: Request | undefined; headers?: Headers | undefined };

type Hook = ReturnType<typeof bearer>['hooks']['before'][number];

type HookContext = Parameters<Hook['matcher']>[0];

/**
 * Whether a request already carries a session in its cookie.
 *
 * @param asked - The request, as the auth library hands it to a hook.
 * @returns Whether a session cookie came with it.
 */
const carriesASessionCookie = (asked: Asked): boolean =>
  A_SESSION_COOKIE.test(asked.request?.headers.get('cookie') ?? asked.headers?.get('cookie') ?? '');

/**
 * Accepts a session token sent as a bearer, from a client that keeps no cookies of its own — the
 * Apple TV app is the one this is for.
 *
 * Only the half of the library's plugin that reads the header is kept, and only for a request with no
 * session cookie. A cookie is what a browser signs in with and it stays the one that counts: a stray
 * `Authorization` header, from a proxy or anything else, cannot stand in for it or sign anybody out.
 * The other half, which copies every new session's token into a response header a page's own scripts
 * could read, is left out, so a browser's session stays in a cookie nothing on the page can see.
 *
 * @returns The plugin.
 */
const bearerWithoutACookie = () => {
  const plugin = bearer();

  return {
    ...plugin,
    hooks: {
      before: plugin.hooks.before.map((hook) => ({
        ...hook,
        matcher: (asked: HookContext) => !carriesASessionCookie(asked) && hook.matcher(asked),
      })),
    },
  };
};

export { bearerWithoutACookie, carriesASessionCookie };
