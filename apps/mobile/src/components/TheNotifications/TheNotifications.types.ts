import type { PartyInvitation } from '@ValenceClient/party/readPartyInvitation';
import type { APage } from '@ValenceMobile/components/SignedIn/SignedIn.types';

type TheNotificationsProps = {
  onOpen: (page: APage) => void;
  onJoin: (invitation: PartyInvitation) => void;
  onBack: () => void;
};

export type { TheNotificationsProps };
