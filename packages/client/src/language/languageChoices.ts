import { LANGUAGES } from '@ValenceI18n/LANGUAGES';
import { languageName } from '@ValenceI18n/languageName';
import { say } from '@ValenceI18n/say';
import { SAME_AS_THE_DEVICE } from './SAME_AS_THE_DEVICE';

/**
 * The languages somebody can choose, each named in itself, after the choice to choose none and
 * follow whatever comes next: the device's own languages, unless something else is named.
 *
 * @param followLabel - What choosing none is called, where it follows something other than the
 *   device.
 * @returns The choices, by id and label.
 */
const languageChoices = (
  followLabel: string = say('screens.accountArea.profileSettings.sameAsThisDevice'),
): { id: string; label: string }[] => [
  { id: SAME_AS_THE_DEVICE, label: followLabel },
  ...LANGUAGES.map((language) => ({ id: language, label: languageName(language) })),
];

export { languageChoices };
