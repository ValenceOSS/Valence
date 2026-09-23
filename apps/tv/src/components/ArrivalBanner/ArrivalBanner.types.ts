import type { Notification } from '@ValenceContracts/schemas/Notification';

type ArrivalBannerProps = {
  arrival: Notification;
  picture: string | null;
  onWatch: () => void;
  onDismiss: () => void;
};

export type { ArrivalBannerProps };
