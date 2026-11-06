import { LIST_FIELDS } from '@ValenceContracts/schemas/BulkTitleEdit';
import type { BulkTitleChange, ListField } from '@ValenceContracts/schemas/BulkTitleEdit';
import type { TitleField, TitleValue } from '@ValenceContracts/schemas/TitleEdit';
import type { BulkTouch } from './BulkTouch.types';

/**
 * Whether a field is one of the lists of words, which are added to and taken from.
 *
 * @param field - The field.
 * @returns Whether it is.
 */
const isListField = (field: TitleField): field is ListField =>
  LIST_FIELDS.some((one) => one === field);

/**
 * Turns the fields somebody touched in the bulk editor into the one change sent for every title:
 * values set, words added, taken away or put in place of the rest, fields emptied or put back, the
 * sort title filled from each title, and the content rating in the server's own country.
 *
 * @param touches - What was done to each field touched.
 * @param region - The server's own country, whose content rating is set.
 * @returns The change.
 */
const changeOfTouches = (
  touches: ReadonlyMap<TitleField, BulkTouch>,
  region: string,
): BulkTitleChange => {
  const set: Partial<Record<TitleField, TitleValue>> = {};
  const add: Partial<Record<ListField, string[]>> = {};
  const remove: Partial<Record<ListField, string[]>> = {};
  const clear: TitleField[] = [];
  const reset: TitleField[] = [];
  let isFromTitle = false;
  let rating: string | null | undefined;

  for (const [field, touch] of touches) {
    switch (touch.kind) {
      case 'set':
        set[field] = touch.value;
        break;
      case 'clear':
        clear.push(field);
        break;
      case 'reset':
        reset.push(field);
        break;
      case 'fromTitle':
        isFromTitle = true;
        break;
      case 'rating':
        rating = touch.rating;
        break;
      case 'words':
        if (!isListField(field)) {
          break;
        }

        if (touch.how === 'replace') {
          set[field] = [...touch.words];
        } else if (touch.how === 'add') {
          add[field] = [...touch.words];
        } else {
          remove[field] = [...touch.words];
        }
        break;
    }
  }

  return {
    ...(Object.keys(set).length === 0 ? {} : { set }),
    ...(Object.keys(add).length === 0 ? {} : { add }),
    ...(Object.keys(remove).length === 0 ? {} : { remove }),
    ...(clear.length === 0 ? {} : { clear }),
    ...(reset.length === 0 ? {} : { reset }),
    ...(isFromTitle ? { sortTitleFromTitle: true } : {}),
    ...(rating === undefined ? {} : { contentRating: { region, rating } }),
  };
};

export { changeOfTouches };
