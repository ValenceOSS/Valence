import { useQueryClient } from '@tanstack/react-query';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { editTitleMetadata, undoTitleChange } from '@ValenceClient/admin/fetchTitleMetadata';
import { notify } from '@ValenceUI/notify';
import type { TitleEditAnswer, TitleScope } from '@ValenceClient/admin/fetchTitleMetadata';
import type { TitleEditRequest } from '@ValenceContracts/schemas/TitleEdit';
import { say } from '@ValenceI18n/say';

/**
 * Changes a title's metadata and keeps the page in step with it: the title's fields are replaced
 * with what the server answers, its history is read again, and every change is said in one toast
 * per title, replaced rather than stacked, with a way to undo the latest.
 *
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, the file's season, or the file's episode.
 * @returns How to change it, answering whether it worked and why not.
 */
const useTitleChange = (mediaId: string, scope: TitleScope) => {
  const cache = useQueryClient();

  /**
   * Takes the server's answer into the page.
   *
   * @param answer - What the server answered.
   * @param said - What to say once it worked.
   * @returns Whether it worked, and why not.
   */
  const settle = (answer: TitleEditAnswer, said: string): { isSaved: boolean; reason: string } => {
    if (answer.kind === 'refused') {
      return { isSaved: false, reason: answer.reason };
    }

    const { changeSetId, metadata } = answer.outcome;

    cache.setQueryData(adminQueries.titleMetadata(mediaId, scope).queryKey, metadata);
    void cache.invalidateQueries({ queryKey: adminQueries.titleHistory(mediaId, scope).queryKey });
    void cache.invalidateQueries({ queryKey: adminQueries.everyFile([]).queryKey.slice(0, 2) });

    if (changeSetId !== null) {
      notify.worked(said, {
        id: `title-metadata-${metadata.subject.key}`,
        action: {
          label: say('common.undo'),
          onPress: () => {
            void undo(changeSetId);
          },
        },
      });
    }

    return { isSaved: true, reason: '' };
  };

  /**
   * Undoes a change, saying why where it could not be.
   *
   * @param changeSetId - The change.
   */
  const undo = async (changeSetId: string): Promise<void> => {
    const outcome = settle(
      await undoTitleChange(mediaId, scope, changeSetId),
      say('screens.adminArea.titleDetails.undone'),
    );

    if (!outcome.isSaved) {
      notify.failed(outcome.reason);
    }
  };

  const change = async (request: TitleEditRequest) =>
    settle(
      await editTitleMetadata(mediaId, scope, request),
      say('screens.adminArea.titleDetails.saved'),
    );

  return { change, undo };
};

export { useTitleChange };
