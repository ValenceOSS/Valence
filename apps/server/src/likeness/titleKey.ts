import type { TitleKind } from './Likeness';

/**
 * Names a title by its kind and the catalogue's identifier for it, a film and a programme being
 * numbered apart in the catalogue.
 *
 * @param kind - Film or programme.
 * @param catalogueId - The catalogue's identifier for it.
 * @returns The name.
 */
const titleKey = (kind: TitleKind, catalogueId: string): string => `${kind}:${catalogueId}`;

export { titleKey };
