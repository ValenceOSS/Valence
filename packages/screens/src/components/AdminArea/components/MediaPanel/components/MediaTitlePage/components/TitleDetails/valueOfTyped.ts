import type { TitleField, TitleValue } from '@ValenceContracts/schemas/TitleEdit';

const NUMBERS: readonly TitleField[] = ['rating', 'rottenTomatoes'];

const YOUTUBE =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/u;

const CLEARABLE_TO_NOTHING: readonly TitleField[] = ['title'];

/**
 * Reads what was typed into a field as the value it is saved as.
 *
 * @param field - The field.
 * @param typed - What was typed.
 * @returns The value.
 */
const valueOfTyped = (field: TitleField, typed: string): TitleValue => {
  const trimmed = typed.trim();

  if (NUMBERS.includes(field)) {
    const read = Number(trimmed);

    return trimmed === '' || Number.isNaN(read) ? null : read;
  }

  if (field === 'trailer') {
    return trimmed === '' ? null : (YOUTUBE.exec(trimmed)?.[1] ?? trimmed);
  }

  return trimmed === '' && !CLEARABLE_TO_NOTHING.includes(field) ? null : typed;
};

export { valueOfTyped };
