import type { Language } from '@ValenceI18n/LANGUAGES';
import type { AppIcon } from '@ValenceClient/shell/AppIconSchema';
import type { Avatar, ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';
import type { Theme } from '@ValenceClient/shell/theme';
import type { Motion } from '@ValenceClient/shell/motion';

type DeviceChoices = {
  language: Language | null;
  theme: Theme;
  motion: Motion;
  pluginTheme: string | null;
  playsInTheBrowser: boolean;
  connections: number;
  streamingFormat: 'hls' | 'dash';
  showsDesktopNotices: boolean;
  appIcon: AppIcon;
};

type ProfileDraft = DeviceChoices & {
  name: string;
  colour: ProfileColour;
  avatar: Avatar;
  askStillWatchingAfter: number;
  showsWhatIamWatching: boolean;
  discordPresence: DiscordPresence;
  prefersBestCopy: boolean;
  deviceWas: DeviceChoices;
  photo: File | null;
};

type ProfileSettingsProps = {
  profile: ViewerProfile | null;
  draft: ProfileDraft | null;
  onDraft: (change: Partial<ProfileDraft>) => void;
};

export type { DeviceChoices, ProfileDraft, ProfileSettingsProps };
