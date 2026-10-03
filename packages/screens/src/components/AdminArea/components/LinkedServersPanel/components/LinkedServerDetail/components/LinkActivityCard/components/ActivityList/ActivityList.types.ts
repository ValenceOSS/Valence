import type { FederationActivity } from '@ValenceContracts/schemas/LinkSharing';

type ActivityListProps = {
  entries: readonly FederationActivity[];
  itself: string;
  someone: string;
};

export type { ActivityListProps };
