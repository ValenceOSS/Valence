import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const MARKUP = /<[^>]+>/g;

const SERVER_DATA = /<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/;

/**
 * Reads JSON without throwing, as nothing where it is not JSON.
 *
 * @param text - What might be JSON.
 * @returns What it says, or nothing.
 */
const readJson = (text: string): JsonValue | null => {
  try {
    const read = JsonValueSchema.safeParse(JSON.parse(text));

    return read.success ? read.data : null;
  } catch {
    return null;
  }
};

/**
 * Looks through what a page says for the notes its "more" sheet opens on.
 *
 * @param value - Some part of what the page says.
 * @returns The notes, or nothing where this part has none.
 */
const notesIn = (value: JsonValue): string | null => {
  if (Array.isArray(value)) {
    for (const each of value) {
      const found = notesIn(each);

      if (found !== null) {
        return found;
      }
    }

    return null;
  }

  if (value === null || typeof value !== 'object') {
    return null;
  }

  const sheet = value.modalPresentationDescriptor;

  if (
    sheet !== undefined &&
    sheet !== null &&
    typeof sheet === 'object' &&
    !Array.isArray(sheet) &&
    typeof sheet.paragraphText === 'string' &&
    sheet.paragraphText.replace(MARKUP, '').trim() !== ''
  ) {
    return sheet.paragraphText.replace(MARKUP, '').trim();
  }

  return notesIn(Object.values(value));
};

/**
 * Reads the notes Apple Music's editors wrote about an album from its public page, where it has
 * any: the page carries what it shows as data, and the notes are the text its "more" sheet opens on.
 *
 * @param page - The album's public Apple Music page.
 * @returns The notes, paragraphs apart and without the markup that sets a title in italics, or
 *   nothing where the page has none.
 */
const appleEditorialNotesIn = (page: string): string | null => {
  const data = SERVER_DATA.exec(page)?.[1];
  const read = data === undefined ? null : readJson(data);

  return read === null ? null : notesIn(read);
};

export { appleEditorialNotesIn };
