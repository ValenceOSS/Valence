import { createHash } from 'node:crypto';

/**
 * A lasting identifier for one thing in a smart list, the same every time the list is read, shaped
 * as the identifiers of the entries somebody puts in a list by hand are.
 *
 * @param listId - The list.
 * @param subjectId - What is in it.
 * @returns The identifier.
 */
const smartEntryId = (listId: string, subjectId: string): string => {
  const hex = createHash('sha1').update(`${listId}:${subjectId}`).digest('hex');
  const variant = ((Number.parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

export { smartEntryId };
