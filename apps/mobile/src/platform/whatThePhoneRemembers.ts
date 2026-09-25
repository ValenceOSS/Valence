import AsyncStorage from '@react-native-async-storage/async-storage';
import { HELD_RESUMES } from '@ValenceMobile/platform/HELD_RESUMES';

/**
 * Everything this phone has been told to remember, read in one go before anything asks for a piece
 * of it.
 *
 * The application reads a preference while it is drawing and nothing sensible can be drawn around a
 * promise, so the store it is given answers at once. Phone storage does not, which leaves one
 * choice: read the lot before the application starts and keep a copy. The same answer the desktop
 * reached, for the same reason.
 *
 * What a paused download left to pick up from is left out. It is large, nothing draws from it, and
 * it is read when that download is picked up again rather than holding up the first screen.
 *
 * A phone that cannot be read from starts empty rather than refusing to start. Somebody is then
 * asked for their server again, which is a nuisance; a client that will not open is worse.
 *
 * @returns What it remembers, ready to be read from.
 */
const whatThePhoneRemembers = async (): Promise<Map<string, string>> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys.filter((key) => !key.startsWith(HELD_RESUMES)));

    return new Map(
      pairs.flatMap(([key, value]) => (value === null ? [] : [[key, value] as const])),
    );
  } catch {
    return new Map();
  }
};

export { whatThePhoneRemembers };
