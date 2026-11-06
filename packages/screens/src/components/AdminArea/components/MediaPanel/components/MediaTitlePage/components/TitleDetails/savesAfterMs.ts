import { WORD_FIELDS } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/WORD_FIELDS';
import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';

const TYPING_SETTLES_MS = 700;

/**
 * How long a field waits after a change before saving it: a list of words at once, since each word
 * is added whole, and anything typed once the typing stops, so a name is saved once rather than once
 * a letter.
 *
 * @param field - The field.
 * @returns The wait, in milliseconds.
 */
const savesAfterMs = (field: TitleField): number =>
  WORD_FIELDS.includes(field) ? 0 : TYPING_SETTLES_MS;

export { savesAfterMs };
