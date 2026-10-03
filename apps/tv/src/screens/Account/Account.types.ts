import type { PartyInvitation } from '@ValenceClient/party/readPartyInvitation';
import type { View } from 'react-native';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { SessionUser } from '@ValenceContracts/schemas/Session';

type AccountProps = {
  user: SessionUser;
  onChangeServer: () => void;
  onRequests: () => void;
  onCalendar: () => void;
  onOpenRequest: (request: MediaRequest) => void;
  onOpenPluginPage: (page: { pluginId: string; pageId: string }) => void;
  onOpenNamed: (wanted: {
    kind: 'film' | 'show';
    mediaId: string;
    seriesId?: string | null;
  }) => void;
  onJoin: (invitation: PartyInvitation) => void;
  upTo: View | null;
};

export type { AccountProps };
