import { LanguagesInUseSchema } from '@ValenceContracts/schemas/SpokenLanguage';
import type { LanguagesInUse } from '@ValenceContracts/schemas/SpokenLanguage';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { LANGUAGES_IN_USE_KEY } from './LANGUAGES_IN_USE_KEY';

const NONE_CHOSEN: LanguagesInUse = { server: null, profile: null };

/**
 * The languages this device last heard its server and the profile watching had chosen, so it can
 * speak them before it has asked again.
 *
 * @returns The languages, or neither where it has not heard or what it kept no longer reads.
 */
const readLanguagesInUse = (): LanguagesInUse => {
  const kept = platformInUse().store.read(LANGUAGES_IN_USE_KEY);

  if (kept === null) {
    return NONE_CHOSEN;
  }

  try {
    const read = LanguagesInUseSchema.safeParse(JSON.parse(kept));

    return read.success ? read.data : NONE_CHOSEN;
  } catch {
    return NONE_CHOSEN;
  }
};

export { readLanguagesInUse };
