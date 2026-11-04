import { NAME_MAX } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * Shortens a name to the most a profile's name may hold, ending it with an ellipsis where it was
 * cut, so an account's own longer name can stand on the way in without the apps refusing the list.
 *
 * @param name - The name to fit.
 * @returns The name, or as much of it as fits followed by an ellipsis.
 */
const fitProfileName = (name: string): string => {
  const letters = Array.from(name);

  return letters.length <= NAME_MAX
    ? name
    : `${letters
        .slice(0, NAME_MAX - 1)
        .join('')
        .trimEnd()}…`;
};

export { fitProfileName };
