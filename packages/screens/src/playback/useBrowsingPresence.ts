import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { isTheDesktopClient, nowWatching } from '@ValenceScreens/desktop/theDesktopShell';

/**
 * Says that somebody has Valence open, so their status stands between the things they watch.
 *
 * This sits above the player rather than inside it, because it has to outlive one: somebody who
 * finishes an episode and goes back to the library has not stopped using Valence, and a status that
 * appeared and vanished around each episode would say less than one that stays.
 *
 * The player says something more specific while it is playing, and says this again on its way out.
 * Both go to the same place and the last one said is the one shown, so the two need no agreement
 * beyond saying the same thing about the same moment.
 *
 * Nothing is said at all where the profile did not ask for it, or in a browser, which has nothing to
 * say it to, or where nobody has signed in yet to have a profile to ask.
 *
 * @param isSignedIn - Whether there is a profile to read the setting from at all.
 */
const useBrowsingPresence = (isSignedIn: boolean): void => {
  const asked = useQuery({ ...profileQueries.watching(), enabled: isSignedIn });
  const isAllowed = isSignedIn && (asked.data?.showsWhatIamWatching ?? false);

  useEffect(() => {
    if (!isAllowed || !isTheDesktopClient()) {
      nowWatching(null);

      return;
    }

    nowWatching({ kind: 'browsing' });

    return () => {
      nowWatching(null);
    };
  }, [isAllowed]);
};

export { useBrowsingPresence };
