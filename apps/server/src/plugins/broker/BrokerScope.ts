import type { Viewer } from '@ValenceServer/visibility/Viewer';

type BrokerScope =
  | {
      kind: 'viewer';
      profileId: string;
      accountId: string;
      isAdmin: boolean;
      reads: Viewer;
    }
  | { kind: 'background'; profileId: string | null; jobId?: string; isHousehold?: boolean }
  | { kind: 'nobody' };

export type { BrokerScope };
