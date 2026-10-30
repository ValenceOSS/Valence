import type { Notification } from '@ValenceContracts/schemas/Notification';

type ANotificationProps = {
  notification: Notification;
  now: Date;
  onPress: () => void;
};

export type { ANotificationProps };
