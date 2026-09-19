import type {
  IndexerDefinitionSummary,
  IndexerPrivacy,
} from '@ValenceContracts/schemas/IndexerDefinition';

type CatalogueFilter = {
  words: string;
  privacy: IndexerPrivacy | 'any';
  category: string;
  language: string;
};

/**
 * The definitions a filter leaves: those whose name or description has every word typed, of the
 * privacy, category and language chosen. An empty choice leaves everything.
 *
 * @param definitions - The catalogue.
 * @param filter - What was chosen.
 * @returns The definitions that match.
 */
const filterCatalogue = (
  definitions: readonly IndexerDefinitionSummary[],
  { words, privacy, category, language }: CatalogueFilter,
): IndexerDefinitionSummary[] => {
  const terms = words.toLowerCase().split(/\s+/).filter(Boolean);

  return definitions.filter(
    (definition) =>
      terms.every((term) =>
        `${definition.name} ${definition.description}`.toLowerCase().includes(term),
      ) &&
      (privacy === 'any' || definition.privacy === privacy) &&
      (category === '' || definition.categories.includes(category)) &&
      (language === '' || definition.language === language),
  );
};

export type { CatalogueFilter };

export { filterCatalogue };
