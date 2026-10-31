import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * The person using a plugin's page or panel as their playlists see them: themselves rather than an
 * administrator, with the libraries they have unlocked still unlocked.
 *
 * @param person - Their account and profile.
 * @param reads - How the page reads for them.
 * @returns Who to act as.
 */
const asPersonLooking = (
  person: { accountId: string; profileId: string },
  reads: Viewer,
): Viewer => {
  const locked = reads.kind === 'account' ? (reads.lockedLibraries ?? []) : [];

  return {
    kind: 'account',
    accountId: person.accountId,
    profileId: person.profileId,
    isAdministrator: false,
    ...(locked.length === 0 ? {} : { lockedLibraries: locked }),
  };
};

export { asPersonLooking };
