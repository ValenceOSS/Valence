import type { AppContext } from '@ValenceServer/api/AppContext';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Whether whoever is asking may link this server with others, and the refusal where not — the one
 * check every admin route about linked servers starts with.
 *
 * @param context - Who is signed in, and what they hold.
 * @returns A check of a request's headers, answering nothing where they may.
 */
const createLinkKeeper =
  ({ readAccount, requires }: Pick<AppContext, 'readAccount' | 'requires'>) =>
  async (headers: Headers) => {
    if ((await readAccount(headers)) === null) {
      return { body: refuse('error.common.nobodyIsSignedIn'), status: 401 } as const;
    }

    return (await requires(headers, 'server.links'))
      ? null
      : ({ body: refuse('error.linking.thisAccountMayNotLinkServers'), status: 403 } as const);
  };

export { createLinkKeeper };
