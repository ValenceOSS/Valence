import type { View } from 'react-native';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { SessionUser } from '@ValenceContracts/schemas/Session';

type AccountProps = {
  user: SessionUser;
  onChangeServer: () => void;
  onRequests: () => void;
  onCalendar: () => void;
  onOpenRequest: (request: MediaRequest) => void;
  onOpenNamed: (wanted: {
    kind: 'film' | 'show';
    mediaId: string;
    seriesId?: string | null;
  }) => void;
  upTo: View | null;
  onMood: (path: string | null) => void;
};

export type { AccountProps };
