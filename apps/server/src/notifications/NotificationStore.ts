import type { Said } from '@ValenceI18n/SaidSchema';
import type {
  Notification,
  NotificationEvent,
  NotificationPreference,
} from '@ValenceContracts/schemas/Notification';

type NewNotification = {
  event: NotificationEvent;
  title: Said;
  body: Said;
  link: string | null;
};

type NotificationRecipient = { userId: string; profileId: string | null };

type PushEndpoint = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type NotificationStore = {
  listWanting: (event: NotificationEvent, transport: 'inApp' | 'push') => Promise<string[]>;
  notify: (
    recipients: readonly NotificationRecipient[],
    notification: NewNotification,
  ) => Promise<Notification[]>;
  list: (whose: NotificationRecipient, limit: number) => Promise<Notification[]>;
  countUnread: (whose: NotificationRecipient) => Promise<number>;
  markRead: (whose: NotificationRecipient, notificationId?: string) => Promise<void>;
  clear: (whose: NotificationRecipient, notificationId?: string) => Promise<void>;
  readPreferences: (userId: string) => Promise<NotificationPreference[]>;
  writePreference: (userId: string, preference: NotificationPreference) => Promise<void>;
  addPushEndpoint: (userId: string, endpoint: PushEndpoint) => Promise<void>;
  listPushEndpoints: (userId: string) => Promise<PushEndpoint[]>;
  removePushEndpoint: (userId: string, endpoint: string) => Promise<void>;
};

export type { NotificationRecipient, NotificationStore, PushEndpoint };
