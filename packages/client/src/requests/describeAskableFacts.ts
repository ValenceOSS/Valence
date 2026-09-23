import type { CatalogueTitleDetail } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * The facts said under a title's name: its year, how long it runs, and what kind of thing it is.
 *
 * @param title - The title.
 * @returns Such as `2021 · 2 h 35 min · Science Fiction, Drama`, or nothing where nothing is known.
 */
const describeAskableFacts = (
  title: Pick<CatalogueTitleDetail, 'year' | 'runtimeMinutes' | 'genres' | 'subtitle'>,
): string => {
  const runtime =
    title.runtimeMinutes === null
      ? null
      : title.runtimeMinutes < 60
        ? `${title.runtimeMinutes.toString()} min`
        : `${Math.floor(title.runtimeMinutes / 60).toString()} h${title.runtimeMinutes % 60 === 0 ? '' : ` ${(title.runtimeMinutes % 60).toString()} min`}`;

  return [
    title.subtitle,
    title.year?.toString() ?? null,
    runtime,
    title.genres.slice(0, 3).join(', ') || null,
  ]
    .filter((part) => part !== null)
    .join(' · ');
};

export { describeAskableFacts };
