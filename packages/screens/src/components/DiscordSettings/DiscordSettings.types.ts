import type { ProfileDraft } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';

type DiscordSettingsProps = {
  draft: ProfileDraft | null;
  onDraft: (change: Partial<ProfileDraft>) => void;
};

export type { DiscordSettingsProps };
