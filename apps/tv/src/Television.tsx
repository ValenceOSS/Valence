import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { buildQueryClient } from '@ValenceClient/query/queryClient';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { fetchTheWords } from '@ValenceClient/language/fetchTheWords';
import { languageToSpeak } from '@ValenceClient/language/languageToSpeak';
import { thisDevicesLanguages } from '@ValenceClient/language/thisDevicesLanguages';
import { TheWayIn } from '@ValenceTv/screens/TheWayIn/TheWayIn';
import { ControllerHint } from '@ValenceTv/components/ControllerHint/ControllerHint';
import { PromptHost } from '@ValenceTv/components/PromptHost/PromptHost';

/**
 * Valence on a television: the whole application, from choosing a server to watching something.
 *
 * The answers the server gives live in the same cache the web keeps them in, built the same way, so a
 * query that means something on a laptop means the same thing here.
 *
 * It already speaks the television's language in the words it kept from last time, and asks the
 * server for them again where it knows the server; where they changed, everything is drawn again
 * in them.
 */
const Television = () => {
  const [answers] = useState(buildQueryClient);
  const [wordsDrawn, setWordsDrawn] = useState(0);

  useEffect(() => {
    if (platformInUse().serverAddress() === null) {
      return;
    }

    void fetchTheWords(languageToSpeak(thisDevicesLanguages())).then((isChanged) => {
      if (isChanged) {
        setWordsDrawn((drawn) => drawn + 1);
      }
    });
  }, []);

  return (
    <QueryClientProvider key={wordsDrawn} client={answers}>
      <TheWayIn />
      <ControllerHint />
      <PromptHost />
    </QueryClientProvider>
  );
};

Television.displayName = 'Television';

export { Television };
