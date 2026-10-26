import type { Notification } from '@ValenceContracts/schemas/Notification';

type NotificationListProps = {
  notifications: Notification[];
  unread: number;
  push?: { isOn: boolean; onToggle: () => void };
  onRead: (id: string) => void;
  onReadAll: () => void;
  onClearAll: () => void;
  onFollow: (link: string) => void;
};

export type { NotificationListProps };
