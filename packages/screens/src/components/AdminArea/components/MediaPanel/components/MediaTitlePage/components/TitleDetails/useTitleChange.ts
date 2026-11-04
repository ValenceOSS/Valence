import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { editTitleMetadata, undoTitleChange } from '@ValenceClient/admin/fetchTitleMetadata';
import { notify } from '@ValenceUI/notify';
import type { TitleEditAnswer, TitleScope } from '@ValenceClient/admin/fetchTitleMetadata';
import type { TitleEditRequest } from '@ValenceContracts/schemas/TitleEdit';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const TOAST_LASTS_MS = 6000;

/**
 * Changes a title's metadata and keeps the page in step with it: the title's fields are replaced
 * with what the server answers, its history is read again, and every change is said in one toast
 * per title, replaced rather than stacked, counting the changes saved while it stands, with a way
 * to undo the latest.
 *
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, the file's season, or the file's episode.
 * @returns How to change it, answering whether it worked and why not.
 */
const useTitleChange = (mediaId: string, scope: TitleScope) => {
  const cache = useQueryClient();
  const saved = useRef(new Map<string, { count: number; at: number }>());

  /**
   * Counts one more change saved to a title while its toast still stands.
   *
   * @param key - The title.
   * @returns How many it has saved since its toast came up.
   */
  const counted = (key: string): number => {
    const now = Date.now();
    const held = saved.current.get(key);
    const count = held !== undefined && now - held.at < TOAST_LASTS_MS ? held.count + 1 : 1;

    saved.current.set(key, { count, at: now });

    return count;
  };

  /**
   * Takes the server's answer into the page.
   *
   * @param answer - What the server answered.
   * @param said - What to say once it worked, or nothing to count the changes saved.
   * @returns Whether it worked, and why not.
   */
  const settle = (answer: TitleEditAnswer, said?: string): { isSaved: boolean; reason: string } => {
    if (answer.kind === 'refused') {
      return { isSaved: false, reason: answer.reason };
    }

    const { changeSetId, metadata } = answer.outcome;

    cache.setQueryData(adminQueries.titleMetadata(mediaId, scope).queryKey, metadata);
    void cache.invalidateQueries({ queryKey: adminQueries.titleHistory(mediaId, scope).queryKey });
    void cache.invalidateQueries({ queryKey: adminQueries.everyFile([]).queryKey.slice(0, 2) });

    if (changeSetId !== null) {
      notify.worked(
        said ??
          sayCount(
            'screens.adminArea.titleDetails.count.savedChanges',
            counted(metadata.subject.key),
          ),
        {
          id: `title-metadata-${metadata.subject.key}`,
          action: {
            label: say('common.undo'),
            onPress: () => {
              void undo(changeSetId);
            },
          },
        },
      );
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

  /**
   * Sets, locks or puts back fields of the title.
   *
   * @param request - What to change.
   * @param said - What to say once it worked, where something other than that it saved fits.
   * @returns Whether it worked, and why not.
   */
  const change = async (request: TitleEditRequest, said?: string) =>
    settle(await editTitleMetadata(mediaId, scope, request), said);

  return { change, undo };
};

export { useTitleChange };
