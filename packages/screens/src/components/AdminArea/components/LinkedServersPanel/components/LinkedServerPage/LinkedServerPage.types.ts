import type { LinkedServer } from '@ValenceContracts/schemas/LinkedServer';

type LinkedServerPageProps = {
  server: LinkedServer;
  thisServer: string;
  onBack: () => void;
};

export type { LinkedServerPageProps };
