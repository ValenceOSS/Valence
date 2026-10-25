import { useQueryClient } from '@tanstack/react-query';
import { dismissInPlace } from '@ValenceClient/library/dismissInPlace';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { notify } from '@ValenceUI/notify';
import { say } from '@ValenceI18n/say';

/**
 * Takes something off continue watching and says so, with a button to put it back.
 *
 * @returns What to call with the title to take off the row, or null where the server cannot.
 */
const useDismissWithUndo = (): ((media: MediaSummary) => void) | null => {
  const cache = useQueryClient();
  const canDismiss = useServerHas('progress.dismiss') === true;

  if (!canDismiss) {
    return null;
  }

  return (media) => {
    const title = media.seriesTitle ?? media.title;

    void dismissInPlace(cache, media.id, true).then((isAgreed) => {
      if (!isAgreed) {
        notify.failed(say('common.couldNotRemoveTitleFromContinueWatching', { title }));

        return;
      }

      notify.worked(
        say('screens.library.useDismissWithUndo.removedTitleFromContinueWatching', { title }),
        {
          countdown: true,
          action: {
            label: say('common.undo'),
            onPress: () => {
              void dismissInPlace(cache, media.id, false).then((isRestored) => {
                if (!isRestored) {
                  notify.failed(say('client.admin.readRefusal.thatCouldNotBeDoneTry'));
                }
              });
            },
          },
        },
      );
    });
  };
};

export { useDismissWithUndo };
