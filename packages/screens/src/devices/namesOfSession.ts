import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import { sayAgain } from '@ValenceI18n/sayAgain';

/**
 * What an open session's device is called and what it reaches Valence through, in this client's
 * language, falling back to the name the device gave itself where the server named neither.
 *
 * @param session - The session.
 * @returns The device's name, and its client's where it is known.
 */
const namesOfSession = (session: ActiveSession): { device: string; client: string | null } => ({
  device: session.device === null ? session.deviceLabel : sayAgain(session.device),
  client: session.client === null ? null : sayAgain(session.client),
});

export { namesOfSession };
