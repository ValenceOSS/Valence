import type { Hidden } from '@ValenceContracts/schemas/Hidden';

type HideableLibrary = {
  id: string;
  name: string;
};

/**
 * Every library a viewer can hide or bring back, in name order.
 *
 * The server stops listing a library once this viewer hides it, so a list of switches built only
 * from what it lists would lose each switch the moment it was turned off. The ones hidden are put
 * back from the hidden list, which names them.
 *
 * @param listed - The libraries the server still offers this viewer.
 * @param hidden - What this viewer has hidden.
 * @returns The libraries to offer a switch for.
 */
const librariesToHide = (
  listed: readonly HideableLibrary[],
  hidden: readonly Hidden[],
): HideableLibrary[] => {
  const known = new Set(listed.map((library) => library.id));
  const gone = hidden
    .filter((entry) => entry.kind === 'library' && !known.has(entry.subjectId))
    .map((entry) => ({ id: entry.subjectId, name: entry.title }));

  return [...listed.map(({ id, name }) => ({ id, name })), ...gone].sort((one, other) =>
    one.name.localeCompare(other.name),
  );
};

export type { HideableLibrary };

export { librariesToHide };
