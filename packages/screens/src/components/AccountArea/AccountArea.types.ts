import type { SessionUser } from '@ValenceContracts/schemas/Session';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileDraft } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';

type PluginAccountPage = {
  id: string;
  label: string;
  pluginId: string;
  pluginName: string;
  pageId: string;
};

type AccountAreaProps = {
  user: SessionUser;
  panel: string;
  profile: ViewerProfile | null;
  draft: ProfileDraft | null;
  onDraft: (change: Partial<ProfileDraft>) => void;
  onChanged: () => void;
  pluginPages?: readonly PluginAccountPage[];
};

export type { AccountAreaProps, PluginAccountPage };
