import type { TitleField, TitleValue } from '@ValenceContracts/schemas/TitleEdit';

const NUMBERS: readonly TitleField[] = ['rating', 'rottenTomatoes'];

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

  return trimmed === '' && !CLEARABLE_TO_NOTHING.includes(field) ? null : typed;
};

export { valueOfTyped };
