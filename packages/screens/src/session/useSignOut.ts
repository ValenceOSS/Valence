import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notify } from '@ValenceUI/notify';
import { signOut } from '@ValenceClient/session/auth';
import { forgetWhatWasRead } from '@ValenceClient/session/forgetWhatWasRead';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { say } from '@ValenceI18n/say';

/**
 * Ends the session and puts the app back at the way in, from anywhere that offers to — the account
 * dialog and the menu on the bar's face both do, and must leave the same way.
 *
 * Signing out empties the cache rather than only asking who is signed in again, and leaves the
 * page, party included, where nothing of theirs is open.
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
      party: null,
      account: null,
    });

    await forgetWhatWasRead(cache);
  }, [cache, go]);
};

export { useSignOut };
