import type { TitleRow } from '@ValenceContracts/schemas/TitleList';

type SheetChange = {
  row: TitleRow;
  set: {
    title?: string;
    sortTitle?: string | null;
    releaseDate?: string | null;
    genres?: string[];
  };
};

const DAY = /^\d{4}-\d{2}-\d{2}$/u;

/**
 * Reads what a spreadsheet, exported from the media list and edited, asks to change: each row found
 * as a title of the library by its TMDB id, or by its title and year, and each of its title, sort
 * title, release date and genres that differs from what the title holds now.
 *
 * @param rows - The sheet's rows, its heading first.
 * @param titles - The library's titles.
 * @returns What changes on each title, and how many rows were found as no title.
 */
const changesOfSheet = (
  rows: readonly (readonly string[])[],
  titles: readonly TitleRow[],
): { changes: SheetChange[]; unfound: number } => {
  const [heading = [], ...body] = rows;
  const column = (name: string) => heading.indexOf(name);
  const at = {
    kind: column('kind'),
    title: column('title'),
    sortTitle: column('sort_title'),
    year: column('year'),
    releaseDate: column('release_date'),
    genres: column('genres'),
    tmdbId: column('tmdb_id'),
  };
  const cell = (row: readonly string[], index: number): string | undefined =>
    index < 0 ? undefined : (row[index] ?? '').trim();
  const changes: SheetChange[] = [];
  let unfound = 0;

  for (const row of body) {
    const kind = cell(row, at.kind) === 'show' ? 'show' : 'film';
    const tmdbId = cell(row, at.tmdbId) ?? '';
    const name = cell(row, at.title) ?? '';
    const year = cell(row, at.year) ?? '';
    const found =
      (tmdbId === ''
        ? undefined
        : titles.find((one) => one.kind === kind && one.lead.externalId === tmdbId)) ??
      titles.find(
        (one) =>
          one.kind === kind &&
          one.name.toLocaleLowerCase() === name.toLocaleLowerCase() &&
          (year === '' || one.year?.toString() === year),
      );

    if (found === undefined) {
      unfound += 1;
      continue;
    }

    const set: SheetChange['set'] = {};
    const sortTitle = cell(row, at.sortTitle);
    const releaseDate = cell(row, at.releaseDate);
    const genres = cell(row, at.genres);
    const heldSort =
      (found.kind === 'show' ? found.lead.seriesSortTitle : found.lead.sortTitle) ?? null;

    if (name !== '' && tmdbId !== '' && name !== found.name) {
      set.title = name;
    }

    if (sortTitle !== undefined && (sortTitle === '' ? null : sortTitle) !== heldSort) {
      set.sortTitle = sortTitle === '' ? null : sortTitle;
    }

    if (
      releaseDate !== undefined &&
      (releaseDate === '' || DAY.test(releaseDate)) &&
      (releaseDate === '' ? null : releaseDate) !== (found.lead.releaseDate ?? null)
    ) {
      set.releaseDate = releaseDate === '' ? null : releaseDate;
    }

    if (genres !== undefined) {
      const listed = genres
        .split(';')
        .map((one) => one.trim())
        .filter((one) => one !== '');

      if (listed.join('\n') !== (found.lead.genres ?? []).join('\n')) {
        set.genres = listed;
      }
    }

    if (Object.keys(set).length > 0) {
      changes.push({ row: found, set });
    }
  }

  return { changes, unfound };
};

export type { SheetChange };

export { changesOfSheet };
