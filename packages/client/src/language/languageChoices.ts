import { LANGUAGES } from '@ValenceI18n/LANGUAGES';
import { languageName } from '@ValenceI18n/languageName';
import { say } from '@ValenceI18n/say';
import { SAME_AS_THE_DEVICE } from './SAME_AS_THE_DEVICE';

/**
 * The languages somebody can choose for a device, each named in itself, after the choice to follow
 * the device's own.
 *
 * @returns The choices, by id and label.
 */
const languageChoices = (): { id: string; label: string }[] => [
  { id: SAME_AS_THE_DEVICE, label: say('screens.accountArea.profileSettings.sameAsThisDevice') },
  ...LANGUAGES.map((language) => ({ id: language, label: languageName(language) })),
];

export { languageChoices };
