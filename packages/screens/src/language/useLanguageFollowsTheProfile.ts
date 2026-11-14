import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLanguagesInUse } from '@ValenceClient/language/fetchLanguagesInUse';
import { languageToSpeak } from '@ValenceClient/language/languageToSpeak';
import { thisDevicesLanguages } from '@ValenceClient/language/thisDevicesLanguages';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';

/**
 * Starts the app again by reloading the page it is drawn in.
 */
const reloadThePage = (): void => {
  window.location.reload();
};

/**
 * Starts the app again in another language when the profile watching here changes to one that
 * speaks it: somebody else chose who is watching, the profile's own language was changed, or
 * nobody is signed in any more and the server's language takes over. The language the app started
 * in is the one compared with, so words that could not be fetched never start it again and again.
 *
 * @param startAgain - Starts the app again; reloading the page, unless told otherwise.
 */
const useLanguageFollowsTheProfile = (startAgain: () => void = reloadThePage): void => {
  const session = useQuery(sessionQueries.who());
  const isSignedIn = session.data !== null && session.data !== undefined;
  const asked = useQuery({ ...profileQueries.watching(), enabled: isSignedIn });
  const startedIn = useRef(languageToSpeak(thisDevicesLanguages()));
  const watching = isSignedIn ? (asked.data?.id ?? null) : null;
  const language = isSignedIn ? (asked.data?.language ?? null) : null;
  const isSettled = session.isSuccess && (!isSignedIn || asked.isSuccess);

  useEffect(() => {
    if (!isSettled) {
      return;
    }

    void fetchLanguagesInUse().then(() => {
      if (languageToSpeak(thisDevicesLanguages()) !== startedIn.current) {
        startAgain();
      }
    });
  }, [isSettled, watching, language, startAgain]);
};

export { useLanguageFollowsTheProfile };
