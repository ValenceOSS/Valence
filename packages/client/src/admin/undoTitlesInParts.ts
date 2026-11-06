import { BULK_TITLES_AT_ONCE } from '@ValenceContracts/schemas/BulkTitleEdit';
import { undoTitlesTogether } from './undoTitlesTogether';
import type { BulkTarget } from '@ValenceContracts/schemas/BulkTitleEdit';

/**
 * Undoes a change made to however many titles, a part at a time, every part of the undoing kept
 * under one change set of its own.
 *
 * @param changeSetId - The change set.
 * @param targets - The titles it changed.
 * @returns How many titles it put back.
 * @throws With the server's words where a part could not be undone, as when a title changed since.
 */
const undoTitlesInParts = async (
  changeSetId: string,
  targets: readonly BulkTarget[],
): Promise<number> => {
  let undoSetId: string | undefined;
  let undone = 0;

  for (let at = 0; at < targets.length; at += BULK_TITLES_AT_ONCE) {
    const part = await undoTitlesTogether({
      changeSetId,
      targets: targets.slice(at, at + BULK_TITLES_AT_ONCE),
      ...(undoSetId === undefined ? {} : { undoSetId }),
    });

    undoSetId = part.changeSetId;
    undone += part.undone;
  }

  return undone;
};

export { undoTitlesInParts };
