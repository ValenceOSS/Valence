/**
 * Leaves out where each item being filed was before, where another of the request's items still
 * holds that file, so that filing a better copy does not delete what the others are in.
 *
 * Two episodes in one file share its path. A better release of one of them, filed on its own,
 * removed the file it replaced, and the other episode with it, which was left pointing at nothing.
 *
 * @param filing - The items a download is being filed for.
 * @param all - Every item of the request.
 * @returns The items to file, where each was before left out if another still holds it.
 */
const keepingSharedFiles = <T extends { id: string; filePath: string | null }>(
  filing: readonly T[],
  all: readonly T[],
): T[] => {
  const filingIds = new Set(filing.map((item) => item.id));
  const heldElsewhere = new Set(
    all.flatMap((item) =>
      filingIds.has(item.id) || item.filePath === null ? [] : [item.filePath],
    ),
  );

  return filing.map((item) =>
    item.filePath !== null && heldElsewhere.has(item.filePath) ? { ...item, filePath: null } : item,
  );
};

export { keepingSharedFiles };
