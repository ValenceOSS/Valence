import type { Notification } from '@ValenceContracts/schemas/Notification';

type ArrivalBannerProps = {
  arrival: Notification;
  picture: string | null;
  isAnInvitation?: boolean;
  onWatch: () => void;
  onDismiss: () => void;
};

export type { ArrivalBannerProps };
