import type { Avatar, ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';

type ProfileDraft = {
  name: string;
  colour: ProfileColour;
  avatar: Avatar;
  askStillWatchingAfter: number;
  showsWhatIamWatching: boolean;
  discordPresence: DiscordPresence;
  prefersBestCopy: boolean;
  showsDesktopNotices: boolean;
  photo: File | null;
};

type ProfileSettingsProps = {
  profile: ViewerProfile | null;
  draft: ProfileDraft | null;
  onDraft: (change: Partial<ProfileDraft>) => void;
};

export type { ProfileDraft, ProfileSettingsProps };
