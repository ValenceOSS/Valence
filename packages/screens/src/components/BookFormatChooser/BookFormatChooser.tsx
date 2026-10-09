import { Checkbox } from '@ValenceUI/Checkbox';
import { FormField } from '@ValenceUI/FormField';
import { BOOK_FORMATS } from '@ValenceContracts/schemas/MediaRequest';
import type { BookFormatChooserProps } from './BookFormatChooser.types';
import { say } from '@ValenceI18n/say';

const NAMES = {
  ebook: say('common.ebook'),
  audiobook: say('common.audiobook'),
};

/**
 * Which formats of a book to fetch: the ebook, the audiobook, or both, each searched for and
 * tracked on its own.
 *
 * @param value - The formats ticked.
 * @param onChange - Told the formats as they change, in the order they are offered.
 */
const BookFormatChooser = ({ value, onChange }: BookFormatChooserProps) => (
  <FormField
    label={say('screens.adminArea.profileEditor.formats')}
    description={say('screens.bookFormatChooser.eachIsSearchedForOnItsOwn')}
  >
    <ul aria-label={say('screens.bookFormatChooser.whichFormats')} className="flex gap-4">
      {BOOK_FORMATS.map((format) => (
        <li key={format}>
          <Checkbox
            label={NAMES[format]}
            checked={value.includes(format)}
            onCheckedChange={(isChecked) => {
              onChange(
                BOOK_FORMATS.filter((one) => (one === format ? isChecked : value.includes(one))),
              );
            }}
          />
        </li>
      ))}
    </ul>
  </FormField>
);

BookFormatChooser.displayName = 'BookFormatChooser';

export { BookFormatChooser };
