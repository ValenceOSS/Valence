import { areDeviceNoticesOn } from '@ValenceClient/notifications/deviceNotices';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileDraft } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';

/**
 * Reads a profile as a draft of itself, which is what every control in the profile editor changes
 * until it is saved.
 *
 * @param profile - The profile as the server holds it.
 * @returns The same thing, with nothing uploaded yet.
 */
const draftOfProfile = (profile: ViewerProfile): ProfileDraft => ({
  name: profile.name,
  colour: profile.colour,
  avatar: profile.avatar,
  askStillWatchingAfter: profile.askStillWatchingAfter,
  showsWhatIamWatching: profile.showsWhatIamWatching,
  discordPresence: profile.discordPresence,
  prefersBestCopy: profile.prefersBestCopy,
  showsDesktopNotices: areDeviceNoticesOn(),
  photo: null,
});

export { draftOfProfile };
