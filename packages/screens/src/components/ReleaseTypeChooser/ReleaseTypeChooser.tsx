import { Checkbox } from '@ValenceUI/Checkbox';
import { FormField } from '@ValenceUI/FormField';
import { RELEASE_TYPES } from '@ValenceContracts/schemas/MediaRequest';
import { RELEASE_TYPE_NAMES } from '@ValenceClient/requests/RELEASE_TYPE_NAMES';
import type { ReleaseTypeChooserProps } from './ReleaseTypeChooser.types';
import { say } from '@ValenceI18n/say';

/**
 * Which kinds of an artist's releases to fetch, now and as new ones come out — albums, EPs,
 * singles, live records and compilations — ticked in the order they are offered.
 *
 * @param value - The kinds ticked.
 * @param onChange - Told the kinds as they change, in the order they are offered.
 */
const ReleaseTypeChooser = ({ value, onChange }: ReleaseTypeChooserProps) => (
  <FormField
    label={say('screens.releaseTypeChooser.label')}
    description={say('screens.releaseTypeChooser.description')}
  >
    <ul
      aria-label={say('screens.releaseTypeChooser.listLabel')}
      className="grid gap-2 sm:grid-cols-3"
    >
      {RELEASE_TYPES.map((type) => (
        <li key={type}>
          <Checkbox
            label={RELEASE_TYPE_NAMES[type].label}
            checked={value.includes(type)}
            onCheckedChange={(isChecked) => {
              onChange(
                RELEASE_TYPES.filter((one) => (one === type ? isChecked : value.includes(one))),
              );
            }}
          />
        </li>
      ))}
    </ul>
  </FormField>
);

ReleaseTypeChooser.displayName = 'ReleaseTypeChooser';

export { ReleaseTypeChooser };
