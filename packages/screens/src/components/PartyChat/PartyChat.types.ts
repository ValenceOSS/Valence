import type { PartyChatLine } from '@ValenceContracts/schemas/WatchParty';

type PartyChatProps = {
  lines: readonly PartyChatLine[];
  meConnectionId: string | null;
  onWrite: (text: string) => void;
};

export type { PartyChatProps };
