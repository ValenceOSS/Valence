import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';

type ConnectToServerProps = {
  onConnected: (address: string) => void;
  startWith?: string;
  couldNotReach?: string;
  reach?: (address: string) => Promise<boolean>;
  found?: readonly string[];
  nearby?: readonly NearbyValence[];
  recent?: readonly string[];
  build?: string | null;
};

export type { ConnectToServerProps };
