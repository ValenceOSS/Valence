import { say } from '@ValenceI18n/say';

/**
 * Names a catalogue show with its year where it has one, which tells apart a revival from the show
 * it carries on, as they are often called the same.
 *
 * @param show - The show's name and the year it began.
 * @returns How it is named.
 */
const nameOfCatalogueShow = (show: { title: string; year: number | null }): string =>
  show.year === null
    ? show.title
    : say('common.titleYear', {
        title: show.title,
        year: show.year.toString(),
      });

export { nameOfCatalogueShow };
