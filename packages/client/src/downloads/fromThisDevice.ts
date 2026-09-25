import { platformInUse } from '@ValenceClient/platform/installPlatform';

/**
 * The header that says which device a download request came from, so the server can have that
 * device fetch the file once it is ready, and count the copies each device holds apart.
 *
 * @returns The header.
 */
const fromThisDevice = (): Record<string, string> => ({
  'x-valence-client': platformInUse().thisClientId(),
});

export { fromThisDevice };
