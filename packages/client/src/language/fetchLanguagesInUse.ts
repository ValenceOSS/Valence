import { LanguagesInUseSchema } from '@ValenceContracts/schemas/SpokenLanguage';
import type { LanguagesInUse } from '@ValenceContracts/schemas/SpokenLanguage';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LANGUAGES_IN_USE_KEY } from './LANGUAGES_IN_USE_KEY';
import { readLanguagesInUse } from './readLanguagesInUse';

/**
 * Asks the server which language it speaks and which the profile watching chose, and keeps the
 * answer on the device for the next launch. A server too old to say, or one that cannot be reached,
 * leaves what the device last heard.
 *
 * @returns The languages in use.
 */
const fetchLanguagesInUse = async (): Promise<LanguagesInUse> => {
  const heard = await readFromServer('/api/language', LanguagesInUseSchema).catch(() => null);

  if (heard === null) {
    return readLanguagesInUse();
  }

  platformInUse().store.write(LANGUAGES_IN_USE_KEY, JSON.stringify(heard));

  return heard;
};

export { fetchLanguagesInUse };
