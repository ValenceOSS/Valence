import { WHERE_CHOICE } from './WHERE_CHOICE';
import type { Library } from '@ValenceContracts/schemas/Library';

/**
 * The libraries a choice in the navigation stands for: one library by its id, this server's own,
 * everything one linked server shares, or — for nothing chosen, or a choice that names nothing
 * there is — every library.
 *
 * @param libraries - Every library there is.
 * @param choice - What was chosen, or nothing.
 * @returns The libraries it stands for.
 */
const librariesChosen = (libraries: readonly Library[], choice: string | null): Library[] => {
  if (choice === null) {
    return [...libraries];
  }

  if (choice === WHERE_CHOICE.here) {
    return libraries.filter((library) => (library.linkedServerId ?? null) === null);
  }

  if (choice.startsWith(WHERE_CHOICE.fromPrefix)) {
    const serverId = choice.slice(WHERE_CHOICE.fromPrefix.length);

    return libraries.filter((library) => library.linkedServerId === serverId);
  }

  const one = libraries.find((library) => library.id === choice);

  return one === undefined ? [...libraries] : [one];
};

export { librariesChosen };
