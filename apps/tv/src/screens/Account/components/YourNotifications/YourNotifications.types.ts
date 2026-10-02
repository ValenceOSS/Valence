import type { PartyInvitation } from '@ValenceClient/party/readPartyInvitation';

type YourNotificationsProps = {
  onOpen: (wanted: { kind: 'film' | 'show'; mediaId: string }) => void;
  onJoin: (invitation: PartyInvitation) => void;
  onFocus: () => void;
};

export type { YourNotificationsProps };
