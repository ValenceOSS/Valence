import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';

const NOTIFICATION_EVENTS = [
  'media.added',
  'party.invited',
  'sharing.withdrawn',
  'requests.available',
  'downloads.ready',
  'requests.albumsFound',
  'plugins.message',
] as const;

const NotificationEventSchema = z.enum(NOTIFICATION_EVENTS);

type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

const NotificationSchema = z.object({
  id: z.string().uuid(),
  event: NotificationEventSchema,
  title: SaidSchema,
  body: SaidSchema,
  link: z.string().nullable(),
  createdAt: z.string().datetime(),
  readAt: z.string().datetime().nullable(),
});

type Notification = z.infer<typeof NotificationSchema>;

const NotificationPreferenceSchema = z.object({
  event: NotificationEventSchema,
  inApp: z.boolean(),
  push: z.boolean(),
});

type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;

const DEFAULT_NOTIFICATION_PREFERENCE = { inApp: true, push: false } as const;

export {
  DEFAULT_NOTIFICATION_PREFERENCE,
  NOTIFICATION_EVENTS,
  NotificationEventSchema,
  NotificationPreferenceSchema,
  NotificationSchema,
};

export type { Notification, NotificationEvent, NotificationPreference };
