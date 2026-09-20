import { createHash } from 'node:crypto';
import { STANDARD_CATEGORIES } from '@ValenceRequests/cardigann/STANDARD_CATEGORIES';
import type { CardigannDefinition } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type { IndexerCategory } from '@ValenceContracts/schemas/Indexer';

type Mapping = { tracker: string; description: string | null; standard: number };

const OWN_CATEGORY_BASE = 100_000;

/**
 * The standard category a name means, where it means one. `Other` is the 8000 family, which is the
 * one sites mean by it.
 *
 * @param name - Such as `Movies/HD`.
 * @returns Its number, or null.
 */
const standardByName = (name: string): number | null =>
  STANDARD_CATEGORIES.findLast(([, standard]) => standard === name)?.[0] ?? null;

/**
 * The number a site's own category is given, so that it can be searched by itself: its own id
 * above 100000 where the id is a number, and a stable number from its name where it is not.
 *
 * @param tracker - The site's id for the category.
 * @returns The number.
 */
const ownNumberFor = (tracker: string): number =>
  /^\d+$/.test(tracker)
    ? OWN_CATEGORY_BASE + Number(tracker)
    : OWN_CATEGORY_BASE + createHash('sha1').update(tracker).digest().readUInt16LE(0);

/**
 * The family a category belongs to: 2040 is a kind of 2000.
 *
 * @param standard - The category.
 * @returns Its family.
 */
const familyOf = (standard: number): number => Math.floor(standard / 1000) * 1000;

/**
 * Relates a site's own categories to the standard Newznab ones, both ways.
 *
 * A search names standard categories and the site wants its own, so asking for Movies asks for
 * every site category that is any kind of film. A result names the site's own and Valence wants the
 * standard ones. Where a site describes a category, it is also offered as one of its own, numbered
 * above 100000, so that it can be searched for by itself.
 *
 * @param caps - The definition's `caps`.
 * @returns The map.
 */
const createCategoryMap = (caps: CardigannDefinition['caps']) => {
  const mappings: Mapping[] = [];
  const defaults: string[] = [];

  for (const [tracker, name] of Object.entries(caps.categories ?? {})) {
    const standard = standardByName(name);

    if (standard !== null) {
      mappings.push({ tracker, description: null, standard });
    }
  }

  for (const mapping of caps.categorymappings ?? []) {
    const standard = mapping.cat === undefined ? null : standardByName(mapping.cat);

    if (mapping.cat !== undefined && standard === null) {
      continue;
    }

    if (standard !== null) {
      mappings.push({ tracker: mapping.id, description: mapping.desc ?? null, standard });
    }

    if (mapping.desc !== undefined) {
      mappings.push({
        tracker: mapping.id,
        description: mapping.desc,
        standard: ownNumberFor(mapping.id),
      });
    }

    if (mapping.default) {
      defaults.push(mapping.id);
    }
  }

  return {
    toTracker: (asked: readonly number[]): string[] => [
      ...new Set(
        mappings
          .filter(
            (mapping) =>
              asked.includes(mapping.standard) ||
              (mapping.standard < OWN_CATEGORY_BASE && asked.includes(familyOf(mapping.standard))),
          )
          .map((mapping) => mapping.tracker),
      ),
    ],

    fromTracker: (tracker: string): number[] =>
      tracker.trim() === ''
        ? []
        : mappings
            .filter((mapping) => mapping.tracker.toLowerCase() === tracker.toLowerCase())
            .map((mapping) => mapping.standard),

    fromDescription: (description: string): number[] =>
      description.trim() === ''
        ? []
        : mappings
            .filter((mapping) => mapping.description?.toLowerCase() === description.toLowerCase())
            .map((mapping) => mapping.standard),

    defaults,

    standard: (): IndexerCategory[] => {
      const families = new Map<number, IndexerCategory>();

      for (const mapping of mappings) {
        const family =
          mapping.standard < OWN_CATEGORY_BASE ? familyOf(mapping.standard) : mapping.standard;
        const name =
          mapping.standard < OWN_CATEGORY_BASE
            ? (STANDARD_CATEGORIES.find(([id]) => id === family)?.[1] ?? 'Other')
            : (mapping.description ?? mapping.tracker);
        const entry = families.get(family) ?? { id: family, name, subcategories: [] };

        if (
          mapping.standard !== family &&
          !entry.subcategories.some((one) => one.id === mapping.standard)
        ) {
          entry.subcategories.push({
            id: mapping.standard,
            name: STANDARD_CATEGORIES.find(([id]) => id === mapping.standard)?.[1] ?? name,
          });
        }

        families.set(family, entry);
      }

      return [...families.values()].toSorted((left, right) => left.id - right.id);
    },
  };
};

type CategoryMap = ReturnType<typeof createCategoryMap>;

export type { CategoryMap };

export { createCategoryMap };
