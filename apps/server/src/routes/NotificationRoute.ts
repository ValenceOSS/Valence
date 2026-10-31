import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  NOTIFICATION_EVENTS,
  PhonePushSchema,
  PushDeliverySchema,
} from '@ValenceContracts/schemas/Notification';

const NotificationError = RefusalSchema.openapi('NotificationError');

const NotificationEvent = z.enum(NOTIFICATION_EVENTS);

const Notification = z
  .object({
    id: z.string().uuid(),
    event: NotificationEvent,
    title: SaidSchema,
    body: SaidSchema,
    link: z.string().nullable(),
    createdAt: z.string().datetime(),
    readAt: z.string().datetime().nullable(),
  })
  .openapi('Notification');

const NotificationPreference = z
  .object({
    event: NotificationEvent,
    inApp: z.boolean(),
    push: z.boolean(),
  })
  .openapi('NotificationPreference');

const NOTIFICATION_PAGE = 30;

const listNotificationsRoute = createRoute({
  method: 'get',
  path: '/api/notifications',
  tags: ['Notifications'],
  summary: 'List this account’s notifications',
  responses: {
    200: {
      description: 'The notifications, and how many are unread',
      content: {
        'application/json': {
          schema: z.object({
            notifications: z.array(Notification),
            unread: z.number().int().nonnegative(),
          }),
        },
      },
    },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: NotificationError } },
    },
  },
});

const readNotificationsRoute = createRoute({
  method: 'post',
  path: '/api/notifications/read',
  tags: ['Notifications'],
  summary: 'Mark notifications as read',
  request: {
    body: {
      content: {
        'application/json': { schema: z.object({ id: z.string().uuid().optional() }) },
      },
    },
  },
  responses: {
    200: {
      description: 'How many are left unread',
      content: {
        'application/json': { schema: z.object({ unread: z.number().int().nonnegative() }) },
      },
    },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: NotificationError } },
    },
  },
});

const clearNotificationsRoute = createRoute({
  method: 'post',
  path: '/api/notifications/clear',
  tags: ['Notifications'],
  summary: 'Take notifications off the bell for good',
  request: {
    body: {
      content: {
        'application/json': { schema: z.object({ id: z.string().uuid().optional() }) },
      },
    },
  },
  responses: {
    200: {
      description: 'How many are left unread',
      content: {
        'application/json': { schema: z.object({ unread: z.number().int().nonnegative() }) },
      },
    },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: NotificationError } },
    },
  },
});

const readNotificationPreferencesRoute = createRoute({
  method: 'get',
  path: '/api/notifications/preferences',
  tags: ['Notifications'],
  summary: 'Read notification preferences',
  responses: {
    200: {
      description: 'The preferences',
      content: {
        'application/json': {
          schema: z.object({
            preferences: z.array(NotificationPreference),
            pushPublicKey: z.string(),
            wakesPhones: z.boolean(),
          }),
        },
      },
    },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: NotificationError } },
    },
  },
});

const writeNotificationPreferenceRoute = createRoute({
  method: 'put',
  path: '/api/notifications/preferences',
  tags: ['Notifications'],
  summary: 'Choose what to be told about',
  request: { body: { content: { 'application/json': { schema: NotificationPreference } } } },
  responses: {
    204: { description: 'Saved' },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: NotificationError } },
    },
  },
});

const subscribeToPushRoute = createRoute({
  method: 'post',
  path: '/api/notifications/push',
  tags: ['Notifications'],
  summary: 'Register this browser for push notifications',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            endpoint: z.string().url(),
            p256dh: z.string().min(1),
            auth: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    204: { description: 'This browser will be woken' },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: NotificationError } },
    },
  },
});

const unsubscribeFromPushRoute = createRoute({
  method: 'delete',
  path: '/api/notifications/push',
  tags: ['Notifications'],
  summary: 'Stop waking this browser',
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ endpoint: z.string().url() }) } },
    },
  },
  responses: {
    204: { description: 'This browser will not be woken again' },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: NotificationError } },
    },
  },
});

const registerPhoneRoute = createRoute({
  method: 'post',
  path: '/api/notifications/phones',
  tags: ['Notifications'],
  summary: 'Register this phone to be woken for notifications',
  description:
    'The phone is woken through the push relay, which is told only where to send a push and an opaque delivery identifier. The phone then reads what the notification says from this server. A phone is woken only for notifications meant for the profile it registered as, or for the whole account.',
  request: {
    body: { content: { 'application/json': { schema: PhonePushSchema.openapi('PhonePush') } } },
  },
  responses: {
    204: { description: 'This phone will be woken' },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: NotificationError } },
    },
  },
});

const forgetPhoneRoute = createRoute({
  method: 'delete',
  path: '/api/notifications/phones',
  tags: ['Notifications'],
  summary: 'Stop waking this phone',
  request: {
    body: { content: { 'application/json': { schema: z.object({ token: z.string().min(1) }) } } },
  },
  responses: {
    204: { description: 'This phone will not be woken again' },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: NotificationError } },
    },
  },
});

const readDeliveryRoute = createRoute({
  method: 'get',
  path: '/api/notifications/deliveries/{deliveryId}',
  tags: ['Notifications'],
  summary: 'Read what a push woke this phone to say',
  description:
    'Answers only whoever the notification was meant for, and only for an hour after the push.',
  request: { params: z.object({ deliveryId: z.string().uuid() }) },
  responses: {
    200: {
      description: 'What the notification says',
      content: { 'application/json': { schema: PushDeliverySchema.openapi('PushDelivery') } },
    },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: NotificationError } },
    },
    404: {
      description: 'No such delivery for you, or it has been forgotten',
      content: { 'application/json': { schema: NotificationError } },
    },
  },
});

export {
  listNotificationsRoute,
  readNotificationsRoute,
  clearNotificationsRoute,
  readNotificationPreferencesRoute,
  writeNotificationPreferenceRoute,
  subscribeToPushRoute,
  unsubscribeFromPushRoute,
  registerPhoneRoute,
  forgetPhoneRoute,
  readDeliveryRoute,
  NOTIFICATION_PAGE,
};
