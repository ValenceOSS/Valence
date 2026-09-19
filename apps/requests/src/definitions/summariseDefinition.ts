import { createCategoryMap } from '@ValenceRequests/cardigann/createCategoryMap';
import type { CardigannDefinition } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type { IndexerPrivacy } from '@ValenceContracts/schemas/IndexerDefinition';
import type { DefinitionRecord } from '@ValenceRequests/definitions/DefinitionRecord';

const PRIVACIES: readonly IndexerPrivacy[] = ['public', 'semi-private', 'private'];

/**
 * Says what a definition is in the few words the catalogue lists it by: its name, what it is for,
 * its language, whether anyone can use it, and the kinds of thing it has.
 *
 * @param definition - The definition.
 * @param yaml - It as written, kept to run it later.
 * @param sha - The version it came from.
 * @param fetchedAt - When it was fetched.
 * @returns What the catalogue keeps.
 */
const summariseDefinition = (
  definition: CardigannDefinition,
  yaml: string,
  sha: string,
  fetchedAt: string,
): DefinitionRecord => ({
  id: definition.id,
  name: definition.name,
  description: definition.description,
  language: definition.language,
  privacy: PRIVACIES.find((privacy) => privacy === definition.type) ?? 'private',
  protocol: 'torrent',
  categories: createCategoryMap(definition.caps)
    .standard()
    .filter((category) => category.id < 100_000)
    .map((category) => category.name),
  yaml,
  sha,
  fetchedAt,
});

export { summariseDefinition };
