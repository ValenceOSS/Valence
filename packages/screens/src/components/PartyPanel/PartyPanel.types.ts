import type { PartyRole, WatchParty } from '@ValenceContracts/schemas/WatchParty';
import type { Avatar, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

type Askable = {
  id: string;
  name: string;
  accountId?: string;
  colour?: ProfileColour;
  avatar?: Avatar;
  updatedAt?: string;
};

type PartyPanelProps = {
  party: WatchParty;
  durationSeconds?: number;
  meConnectionId: string | null;
  waitingFor?: readonly string[];
  onSetRole?: (connectionId: string, role: PartyRole) => void;
  onLoosen?: (how: { everyoneMaySeek?: boolean; everyoneMayPlayPause?: boolean }) => void;
  onLeave?: () => void;
  onRemove?: (connectionId: string) => void;
  onSetPassword?: (password: string | null) => void;
  people?: readonly Askable[];
  onAsk?: (profileId: string) => void;
  invitation?: string;
  onCopyInvitation?: (invitation: string) => Promise<void>;
};

export type { PartyPanelProps, Askable };
