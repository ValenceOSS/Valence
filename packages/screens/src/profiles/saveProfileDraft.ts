import { saveProfile, uploadProfilePhoto } from '@ValenceClient/profiles/fetchProfiles';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileDraft } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';

/**
 * Writes a profile editor's draft: any new photograph first, then the name, colour, face and the
 * rest, keeping the old name where the new one was left empty.
 *
 * @param profile - The profile as the server holds it.
 * @param draft - What it should become.
 * @returns Whether all of it was written.
 */
const saveProfileDraft = async (profile: ViewerProfile, draft: ProfileDraft): Promise<boolean> => {
  const sent = draft.photo === null || (await uploadProfilePhoto(profile.id, draft.photo));

  return (
    sent &&
    saveProfile(
      profile.id,
      draft.name.trim() === '' ? profile.name : draft.name.trim(),
      draft.colour,
      draft.avatar,
      draft.askStillWatchingAfter,
      draft.showsWhatIamWatching,
      draft.prefersBestCopy,
      draft.discordPresence,
    )
  );
};

export { saveProfileDraft };
