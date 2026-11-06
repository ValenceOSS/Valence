import { BULK_TITLES_AT_ONCE } from '@ValenceContracts/schemas/BulkTitleEdit';
import { editTitlesTogether } from './editTitlesTogether';
import type {
  BulkTarget,
  BulkTitleChange,
  BulkTitleEditOutcome,
} from '@ValenceContracts/schemas/BulkTitleEdit';

/**
 * Makes one change to however many titles, sent a part at a time so no one request is too large,
 * every part kept under the one change set so it is undone in one step.
 *
 * @param targets - The titles.
 * @param change - The change.
 * @param appliesTo - Whether it is made to them or to their episodes.
 * @param onProgress - Told how many titles have been sent so far.
 * @returns The change set, every title it changed, and how many it left alone or refused.
 * @throws With the server's words where a part could not be changed.
 */
const editTitlesInParts = async (
  targets: readonly BulkTarget[],
  change: BulkTitleChange,
  appliesTo: 'titles' | 'episodes' = 'titles',
  onProgress?: (sent: number) => void,
): Promise<BulkTitleEditOutcome> => {
  let outcome: BulkTitleEditOutcome | null = null;

  for (let at = 0; at < targets.length; at += BULK_TITLES_AT_ONCE) {
    const part = await editTitlesTogether({
      targets: targets.slice(at, at + BULK_TITLES_AT_ONCE),
      appliesTo,
      change,
      ...(outcome === null ? {} : { changeSetId: outcome.changeSetId }),
    });

    outcome =
      outcome === null
        ? part
        : {
            changeSetId: outcome.changeSetId,
            changed: [...outcome.changed, ...part.changed],
            unchanged: outcome.unchanged + part.unchanged,
            refused: outcome.refused + part.refused,
          };
    onProgress?.(Math.min(targets.length, at + BULK_TITLES_AT_ONCE));
  }

  return outcome ?? { changeSetId: '', changed: [], unchanged: 0, refused: 0 };
};

export { editTitlesInParts };
