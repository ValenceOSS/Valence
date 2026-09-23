import type { View } from 'react-native';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { SessionUser } from '@ValenceContracts/schemas/Session';

type AccountProps = {
  user: SessionUser;
  onChangeServer: () => void;
  onRequests: () => void;
  onOpenRequest: (request: MediaRequest) => void;
  upTo: View | null;
};

export type { AccountProps };
