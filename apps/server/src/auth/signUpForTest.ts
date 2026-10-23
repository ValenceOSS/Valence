/* oxlint-disable valence/no-hard-coded-strings -- stands in for somebody in tests */
import type { ValenceAuth } from './Auth';

type RequestableApp = {
  request: (input: string | Request, init?: RequestInit) => Response | Promise<Response>;
};

type MemoryUserStore = {
  user: { id: string; role?: string }[];
};

type RoleGranting = {
  listRoles: () => Promise<{ id: string; name: string }[]>;
  assignRole: (userId: string, roleId: string) => Promise<void>;
};

const TEST_ORIGIN = 'http://localhost:8420';

const TEST_CREDENTIALS = {
  name: 'Marques',
  email: 'marques@valence.local',
  password: 'a-long-enough-password',
};

type Credentials = { name: string; email: string; password: string; username?: string };

/**
 * Makes an account the way an administrator would, from inside the server, then signs it in through
 * the real endpoint and answers with the cookie that keeps it signed in, so that a test exercises the
 * same path a browser does rather than reaching past authentication. Answers with no cookie at all
 * where the account already exists, as asking twice for the same address did.
 *
 * @param app The application under test.
 * @param auth The authentication layer the application was built with.
 * @param credentials Who to sign up, when a suite needs more than one account.
 */
const signUpForTest = async (
  app: RequestableApp,
  auth: ValenceAuth,
  credentials: Credentials = TEST_CREDENTIALS,
): Promise<string> => {
  const { username, ...account } = credentials;
  const isMade = await auth.api
    .createUser({
      body: {
        ...account,
        ...(username === undefined ? {} : { data: { username, displayUsername: username } }),
      },
    })
    .then(
      () => true,
      () => false,
    );

  if (!isMade) {
    return '';
  }

  const response = await app.request(`${TEST_ORIGIN}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: TEST_ORIGIN },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  });

  return response.headers.getSetCookie()[0]?.split(';')[0] ?? '';
};

/**
 * Wraps an application so that every request through it carries a session, for tests about what a
 * signed-in caller can do rather than about signing in.
 *
 * @param app The application under test.
 * @param options The authentication layer the application was built with; `store` and `isAdministrator` together promote the account, for the routes that ask for more than merely being signed in.
 */
const signedInApp = (
  app: RequestableApp,
  options: {
    auth: ValenceAuth;
    store?: MemoryUserStore;
    permissions?: RoleGranting;
    isAdministrator?: boolean;
    settings?: {
      write: (patch: { ownerAccountId: string }) => Promise<{ ownerAccountId: string }>;
    };
  },
): RequestableApp => {
  let cookie: string | null = null;

  return {
    request: async (input: string | Request, init: RequestInit = {}) => {
      if (cookie === null) {
        cookie = await signUpForTest(app, options.auth);

        const account = options.store?.user[0];

        if (options.isAdministrator === true && account !== undefined) {
          account.role = 'admin';

          await makeAdministrator(options.permissions, account.id);
          await options.settings?.write({ ownerAccountId: account.id });
        }
      }

      if (typeof input !== 'string') {
        const carried = new Headers(input.headers);

        carried.set('cookie', cookie);

        return app.request(new Request(input, { headers: carried }));
      }

      const headers = new Headers(init.headers);

      headers.set('cookie', cookie);

      return app.request(input, { ...init, headers });
    },
  };
};

/**
 * Gives an account the Administrator role, for tests that need a request to be allowed to do
 * everything without walking through the setup wizard.
 *
 * @param permissions - The permission service to write to.
 * @param userId - The account to promote.
 */
const makeAdministrator = async (
  permissions: RoleGranting | undefined,
  userId: string,
): Promise<void> => {
  if (permissions === undefined) {
    return;
  }

  const administrator = (await permissions.listRoles()).find(
    (candidate) => candidate.name === 'Administrator',
  );

  if (administrator !== undefined) {
    await permissions.assignRole(userId, administrator.id);
  }
};

export { signUpForTest, signedInApp, makeAdministrator, TEST_ORIGIN };
