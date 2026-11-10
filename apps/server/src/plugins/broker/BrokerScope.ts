import type { Viewer } from '@ValenceServer/visibility/Viewer';

type BrokerScope =
  | {
      kind: 'viewer';
      profileId: string;
      accountId: string;
      isAdmin: boolean;
      reads: Viewer;
      app?: { id: string; label: string; profileName: string };
    }
  | {
      kind: 'background';
      profileId: string | null;
      jobId?: string;
      isHousehold?: boolean;
      isHomeRow?: boolean;
    }
  | { kind: 'nobody' };

export type { BrokerScope };
