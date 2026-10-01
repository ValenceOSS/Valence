import { say } from '@ValenceI18n/say';
import type { ArrProfile } from '@ValenceServer/arrEmulation/ArrEmulation';

const LIBRARY_DEFAULT_PROFILE: ArrProfile = {
  id: '',
  name: say('server.arrEmulation.whateverTheLibraryUses'),
};

export { LIBRARY_DEFAULT_PROFILE };
