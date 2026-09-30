import type { CatalogueTitleDetail } from '@ValenceContracts/schemas/CatalogueTitle';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

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
        ? sayCount('common.count.minutesShort', title.runtimeMinutes)
        : title.runtimeMinutes % 60 === 0
          ? sayCount('common.count.hoursShort', Math.floor(title.runtimeMinutes / 60))
          : say('client.books.describeLength.hoursHOverMin', {
              hours: Math.floor(title.runtimeMinutes / 60).toString(),
              over: (title.runtimeMinutes % 60).toString(),
            });

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
