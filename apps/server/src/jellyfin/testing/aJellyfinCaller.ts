import { aJellyfinOrigin } from '@ValenceServer/jellyfin/testing/aJellyfinOrigin';
import type { JellyfinCaller } from '@ValenceServer/jellyfin/JellyfinBackend';

/**
 * Somebody signed in from a Jellyfin app as their account's owner profile, with whatever a test
 * cares about changed.
 *
 * @param change - What differs.
 * @returns Who is signed in.
 */
const aJellyfinCaller = (change: Partial<JellyfinCaller> = {}): JellyfinCaller => ({
  token: 's.a-session',
  origin: aJellyfinOrigin(),
  headers: new Headers({ authorization: 'Bearer a-session' }),
  viewer: {
    kind: 'account',
    accountId: 'a1',
    profileId: '02791fd9-8547-4c78-898b-00fe47b60627',
    isAdministrator: false,
  },
  accountId: 'a1',
  profile: { id: '02791fd9-8547-4c78-898b-00fe47b60627', name: 'Marnie', isOwner: true },
  isAdministrator: false,
  ...change,
});

export { aJellyfinCaller };
