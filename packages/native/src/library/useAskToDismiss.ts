import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { dismissInPlace } from '@ValenceClient/library/dismissInPlace';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

/**
 * Asks, in the system's own alert on a phone or a television, before taking something off continue
 * watching, and says so where the server would not.
 *
 * @returns What to call with the title held down, or null where the server cannot take one off.
 */
const useAskToDismiss = (): ((media: MediaSummary) => void) | null => {
  const cache = useQueryClient();
  const canDismiss = useServerHas('progress.dismiss') === true;

  const ask = useCallback(
    (media: MediaSummary) => {
      const title = media.seriesTitle ?? media.title;

      Alert.alert(
        say('native.library.useAskToDismiss.removeTitleFromContinueWatching', { title }),
        say('native.library.useAskToDismiss.itComesBackWhenYouWatchIt'),
        [
          { text: say('common.cancel'), style: 'cancel' },
          {
            text: say('common.forget'),
            onPress: () => {
              void dismissInPlace(cache, media.id, true).then((isAgreed) => {
                if (!isAgreed) {
                  Alert.alert(say('common.couldNotRemoveTitleFromContinueWatching', { title }));
                }
              });
            },
          },
        ],
      );
    },
    [cache],
  );

  return canDismiss ? ask : null;
};

export { useAskToDismiss };
