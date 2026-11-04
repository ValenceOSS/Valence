import type { ListedTitle } from './listedTitlesOf';
import type { TitleSort } from '@ValenceContracts/schemas/TitleList';

/**
 * What a title is put in order by for a sort.
 *
 * @param title - The title.
 * @param sort - The sort.
 * @returns The value compared.
 */
const valueOfSort = (title: ListedTitle, sort: TitleSort): string | number => {
  const { row } = title;

  switch (sort) {
    case 'title':
      return row.order;
    case 'year':
      return row.year ?? 0;
    case 'quality':
      return title.maxHeight;
    case 'codec':
      return row.looks.isCodecMixed ? '~' : (row.looks.codec ?? '').toLowerCase();
    case 'audio':
      return title.audioKey;
    case 'length':
      return row.durationSeconds;
    case 'size':
      return row.sizeBytes ?? 0;
    case 'added':
      return row.latestAddedAt;
  }
};

export { valueOfSort };
