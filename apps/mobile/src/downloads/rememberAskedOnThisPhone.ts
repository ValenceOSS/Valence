import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { ASKED_ON_THIS_PHONE } from '@ValenceMobile/downloads/ASKED_ON_THIS_PHONE';
import { askedOnThisPhone } from '@ValenceMobile/downloads/askedOnThisPhone';

/**
 * Remembers that a download was asked for from this phone, or that it no longer needs fetching.
 *
 * @param downloadId - The download.
 * @param isWaiting - Whether it is still to be fetched.
 */
const rememberAskedOnThisPhone = (downloadId: string, isWaiting: boolean): void => {
  const rest = askedOnThisPhone().filter((id) => id !== downloadId);

  platformInUse().store.write(
    ASKED_ON_THIS_PHONE,
    JSON.stringify(isWaiting ? [...rest, downloadId] : rest),
  );
};

export { rememberAskedOnThisPhone };
