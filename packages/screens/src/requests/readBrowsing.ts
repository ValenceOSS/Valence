import { CATALOGUE_BROWSE_KINDS, CATALOGUE_LISTS } from '@ValenceContracts/schemas/CatalogueTitle';
import type { CatalogueBrowse } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Reads which whole list the address is showing, out of what it carries — `film:trending`, or
 * `film:popular:2` where a studio was chosen.
 *
 * @param view - What the address carries, or nothing where it carries nothing.
 * @returns The list to show, or null where the address names something else.
 */
const readBrowsing = (view: string | null): CatalogueBrowse | null => {
  const [said = '', listed = '', studio = ''] = (view ?? '').split(':');
  const kind = CATALOGUE_BROWSE_KINDS.find((candidate) => candidate === said);
  const list = CATALOGUE_LISTS.find((candidate) => candidate === listed);

  if (kind === undefined || list === undefined) {
    return null;
  }

  return { kind, list, studio: studio === '' ? null : studio };
};

export { readBrowsing };
