import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { NowListening, NowReading } from '@ValenceContracts/schemas/BookRemote';

/**
 * Says what this device is doing with a book, which an administrator watching the server sees. It is
 * sent and forgotten, so whatever goes wrong — no server, no device to say it is — is not heard
 * rather than thrown.
 *
 * @param path - Where it is said.
 * @param body - What is said.
 * @returns Whether it was heard.
 */
const tellTheServer = async (
  path: string,
  body: { nowListening: NowListening | null } | { nowReading: NowReading | null },
): Promise<boolean> => {
  try {
    const response = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { ...profileHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ clientId: platformInUse().thisClientId(), ...body }),
    });

    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Says which audiobook this device is playing and where in it, or that it is playing none.
 *
 * @param nowListening - What is playing, or nothing where this device has stopped.
 * @returns Whether it was heard.
 */
const reportNowListening = (nowListening: NowListening | null): Promise<boolean> =>
  tellTheServer('/api/books/now-listening', { nowListening });

/**
 * Says which book this device has open to read and where in it, or that it has none open.
 *
 * @param nowReading - What is open, or nothing where this device has closed it.
 * @returns Whether it was heard.
 */
const reportNowReading = (nowReading: NowReading | null): Promise<boolean> =>
  tellTheServer('/api/books/now-reading', { nowReading });

export { reportNowListening, reportNowReading };
