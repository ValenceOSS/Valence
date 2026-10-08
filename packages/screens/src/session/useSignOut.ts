import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notify } from '@ValenceUI/notify';
import { signOut } from '@ValenceClient/session/auth';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { say } from '@ValenceI18n/say';

/**
 * Ends the session and puts the app back at the way in, from anywhere that offers to — the account
 * dialog and the menu on the bar's face both do, and must leave the same way.
 *
 * Signing out empties the cache rather than only asking who is signed in again. Everything held
 * there belongs to the person leaving — what they kept, how far through things they are, what is
 * waiting on their bell — and handing that to whoever signs in next is a privacy fault, not a stale
 * read. The session's own answers are reset rather than thrown away, so the screens already asking
 * them hear that nobody is signed in now and go to the way in; a query thrown away while a screen
 * still holds it leaves that screen on the old answer until the page is loaded again.
 *
 * @returns Signs out.
 */
const useSignOut = (): (() => Promise<void>) => {
  const { go } = usePlace();
  const cache = useQueryClient();

  return useCallback(async () => {
    const ended = await signOut();

    if (!ended) {
      notify.failed(say('screens.session.useSignOut.youAreStillSignedInThe'));

      return;
    }

    go({
      section: 'home',
      search: '',
      inspecting: null,
      playing: null,
      account: null,
    });

    await cache.resetQueries({ queryKey: sessionQueries.key });
    cache.removeQueries({
      predicate: (query) => query.queryKey[0] !== sessionQueries.key[0],
    });
  }, [cache, go]);
};

export { useSignOut };
