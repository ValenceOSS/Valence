type PublicRoute = {
  method: 'GET' | 'POST';
  path: RegExp;
};

const PUBLIC_ROUTES: readonly PublicRoute[] = [
  { method: 'GET', path: /^\/api\/health$/ },
  { method: 'GET', path: /^\/api\/setup\/status$/ },
  { method: 'GET', path: /^\/api\/appearance$/ },
  { method: 'POST', path: /^\/api\/setup$/ },
  { method: 'GET', path: /^\/api\/auth\// },
  { method: 'POST', path: /^\/api\/auth\// },
  { method: 'GET', path: /^\/api\/profiles\/avatars\/[^/]+$/ },
  { method: 'POST', path: /^\/api\/profiles\/[^/]+\/sign-in$/ },
  { method: 'POST', path: /^\/api\/phone\/exchange$/ },
  { method: 'GET', path: /^\/api\/share\/[^/]+$/ },
  { method: 'GET', path: /^\/api\/calendar\/feed\/[A-Za-z0-9_-]{43}\.ics$/ },
  { method: 'POST', path: /^\/api\/password-reset$/ },
  { method: 'GET', path: /^\/api\/setup-links\/[A-Za-z0-9_-]{32,128}$/ },
  { method: 'POST', path: /^\/api\/setup-links\/[A-Za-z0-9_-]{32,128}$/ },
  { method: 'GET', path: /^\/api\/openapi\.json$/ },
  { method: 'GET', path: /^\/api\/reference$/ },
  {
    method: 'GET',
    path: /^\/api\/plugins\/[a-z][a-z0-9-]{2,63}\/accounts\/[a-z][a-z0-9-]{0,39}\/connect$/,
  },
  { method: 'GET', path: /^\/api\/plugins\/oauth\/callback$/ },
  {
    method: 'POST',
    path: /^\/api\/plugins\/[a-z][a-z0-9-]{2,63}\/hooks\/[a-z][a-z0-9-]{0,39}\/[A-Za-z0-9_-]{16,64}$/,
  },
];

const FACE_ROUTES: readonly PublicRoute[] = [
  { method: 'GET', path: /^\/api\/profiles\/everyone$/ },
  { method: 'GET', path: /^\/api\/profiles\/[^/]+\/avatar$/ },
  { method: 'GET', path: /^\/api\/splashscreen$/ },
];

/**
 * Whether a request may be answered without a session — signing in, first-run setup, and the handful
 * of things a browser asks for before anybody has signed in. Matched on both method and path, so
 * that reading something openly does not also mean writing it.
 *
 * Who lives here is among them while the server says so. A wall of faces is how a household sharing
 * one television expects to be met — pick yourself and watch — so it is the way in a server opens
 * with. It is a setting rather than a rule, because the same wall tells anybody who asks every
 * profile's name, picture and identifier, which is a list of who to try passwords against and who to
 * address a party invitation to; a server facing the open internet can shut it.
 *
 * The picture behind the way in follows the faces rather than standing apart from them. It is
 * whatever the household chose to greet itself with, which is as often a family photograph as a
 * poster, so closing the wall closes it too.
 *
 * Connecting an account to a plugin is open too, because a phone opens it in the system browser,
 * which has no session: the connect address answers only to the one-use ticket a signed-in person
 * was handed, and the callback only to the browser that started it.
 *
 * So is asking for a password reset link, which is for somebody who cannot sign in: it answers the
 * same whether or not an account exists, and asks at most once a minute for any one.
 *
 * So is a plugin's webhook, which an outside service calls with no session of anybody's: the
 * address answers only to the secret it holds, which is that install's alone.
 *
 * The generated avatars stay open: they are drawn from a style and a seed in the address and say
 * nothing about anybody. So does signing in as a face, which needs the identifier already and is a
 * password check rather than a way of finding one.
 *
 * @param method The HTTP method, as the request reports it.
 * @param path The request path, without its query.
 * @param showsFaces Whether this server shows who lives here before anybody has signed in.
 */
const isPublicRoute = (method: string, path: string, showsFaces = false): boolean =>
  [...PUBLIC_ROUTES, ...(showsFaces ? FACE_ROUTES : [])].some(
    (route) => route.method === method.toUpperCase() && route.path.test(path),
  );

export { isPublicRoute };
