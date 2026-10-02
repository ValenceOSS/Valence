import type { ArrPathMapping } from '@ValenceContracts/schemas/ArrImport';

/**
 * A path as an app sees it, written as Valence sees it, through the longest of the admin's
 * mappings that it starts with; a path no mapping covers is left as it is.
 *
 * @param path - The path, as the app wrote it.
 * @param mappings - Where the app's folders are, as the admin said.
 * @returns The path as Valence sees it.
 */
const mapArrPath = (path: string, mappings: readonly ArrPathMapping[]): string => {
  const tidy = (each: string) => (each.length > 1 ? each.replace(/[/\\]+$/, '') : each);
  const given = tidy(path.replaceAll('\\', '/'));
  const covering = mappings
    .map((mapping) => ({ from: tidy(mapping.from.replaceAll('\\', '/')), to: tidy(mapping.to) }))
    .filter(({ from }) => given === from || given.startsWith(from === '/' ? '/' : `${from}/`))
    .toSorted((left, right) => right.from.length - left.from.length)[0];

  if (covering === undefined) {
    return given;
  }

  const rest = given.slice(covering.from === '/' ? 0 : covering.from.length).replace(/^\/+/, '');

  return rest === '' ? covering.to : `${covering.to.replace(/\/+$/, '')}/${rest}`;
};

export { mapArrPath };
