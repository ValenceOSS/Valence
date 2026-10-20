import { readDeviceChoices } from './readDeviceChoices';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileDraft } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';

/**
 * Reads a profile as a draft of itself, with what this device has chosen for itself beside it, which
 * is what every control in the profile editor changes until it is saved. What the device used as
 * the editor opened is kept beside them, so saving changes only what the editor changed.
 *
 * @param profile - The profile as the server holds it.
 * @returns The same thing, with nothing uploaded yet.
 */
const draftOfProfile = (profile: ViewerProfile): ProfileDraft => {
  const device = readDeviceChoices();

  return {
    name: profile.name,
    colour: profile.colour,
    avatar: profile.avatar,
    askStillWatchingAfter: profile.askStillWatchingAfter,
    showsWhatIamWatching: profile.showsWhatIamWatching,
    discordPresence: profile.discordPresence,
    prefersBestCopy: profile.prefersBestCopy,
    ...device,
    deviceWas: device,
    photo: null,
  };
};

export { draftOfProfile };
