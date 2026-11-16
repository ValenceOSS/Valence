/**
 * Which copy of a film its play button plays: the one somebody picked, else the copy they were part
 * way through, else the best copy where they would rather have it, else this server's own. A resume
 * carries on in the copy it was made on, so preferring the best copy only decides a fresh start.
 *
 * @param own - This server's own copy.
 * @param copies - The other copies and editions folded into it.
 * @param choice - What was picked on the page, where anything was.
 * @param resume - The copy their progress was made on, null for this server's own, or undefined
 *   where they have nothing to resume.
 * @param preferred - The best copy, where they prefer it and it is not this server's own.
 * @returns The id of the copy to play.
 */
const whichCopyToPlay = (
  own: string,
  copies: readonly { id: string }[],
  choice: string | null,
  resume: string | null | undefined,
  preferred: string | null,
): string => {
  if (choice !== null) {
    return choice;
  }

  if (resume !== undefined) {
    return copies.find((copy) => copy.id === resume)?.id ?? own;
  }

  return preferred ?? own;
};

export { whichCopyToPlay };
