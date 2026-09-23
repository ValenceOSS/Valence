import type { DeviceOwner } from '@ValenceServer/devices/createDeviceRegistry';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * Whose devices somebody may see and control: their account, and the profile where one has been
 * chosen, so one person's devices are told apart from everybody else's.
 *
 * @param viewer - Who is asking.
 * @returns The owner, or nothing where nobody is signed in.
 */
const deviceOwnerOf = (viewer: Viewer | null): DeviceOwner | null =>
  viewer?.kind === 'account' ? { accountId: viewer.accountId, profileId: viewer.profileId } : null;

export { deviceOwnerOf };
