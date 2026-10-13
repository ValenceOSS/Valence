import type { PartyInvitation } from '@ValenceClient/party/readPartyInvitation';
import type { APage } from '@ValenceMobile/components/SignedIn/SignedIn.types';

type TheNotificationsProps = {
  isOpen: boolean;
  onOpen: (page: APage) => void;
  onJoin: (invitation: PartyInvitation) => void;
  onClose: () => void;
};

export type { TheNotificationsProps };
