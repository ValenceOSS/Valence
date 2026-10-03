import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  CalendarFeedSchema,
  CalendarFeedStatusSchema,
} from '@ValenceContracts/schemas/CalendarFeed';

const CalendarFeedRefusal = RefusalSchema.openapi('CalendarFeedRefusal');

const NOT_SIGNED_IN = {
  description: 'Not signed in',
  content: { 'application/json': { schema: CalendarFeedRefusal } },
};

const calendarFeedRoute = createRoute({
  method: 'get',
  path: '/api/calendar/feed',
  tags: ['Calendar'],
  summary:
    'Read the link the person asking subscribes to the release calendar by, where they have one',
  responses: {
    200: {
      description: 'Their link, when it was made and when a calendar app last read it, or none',
      content: { 'application/json': { schema: CalendarFeedStatusSchema } },
    },
    401: NOT_SIGNED_IN,
  },
});

const ensureCalendarFeedRoute = createRoute({
  method: 'post',
  path: '/api/calendar/feed',
  tags: ['Calendar'],
  summary: 'Read the link to subscribe to the release calendar by, making one where there is none',
  description:
    'Answers the same link every time it is asked, so the calendar can be added on one device after another; only making a new link changes it.',
  responses: {
    200: {
      description: 'The link',
      content: { 'application/json': { schema: CalendarFeedSchema } },
    },
    401: NOT_SIGNED_IN,
  },
});

const renewCalendarFeedRoute = createRoute({
  method: 'post',
  path: '/api/calendar/feed/renew',
  tags: ['Calendar'],
  summary: 'Make a new link to subscribe to the release calendar by, stopping the old one at once',
  responses: {
    201: {
      description: 'The new link',
      content: { 'application/json': { schema: CalendarFeedSchema } },
    },
    401: NOT_SIGNED_IN,
  },
});

const stopCalendarFeedRoute = createRoute({
  method: 'delete',
  path: '/api/calendar/feed',
  tags: ['Calendar'],
  summary: 'Turn off the link to the release calendar, so calendar apps can no longer read it',
  responses: {
    204: { description: 'There is no link any more' },
    401: NOT_SIGNED_IN,
  },
});

const readCalendarFeedRoute = createRoute({
  method: 'get',
  path: '/api/calendar/feed/{file}',
  tags: ['Calendar'],
  summary: 'Read the release calendar as an iCalendar file, by the link a calendar app was given',
  description:
    'Needs no sign-in: the token in the link is the only credential. What it shows is worked out for the person the link belongs to, as the calendar in the app is.',
  request: {
    params: z.object({ file: z.string().regex(/^[A-Za-z0-9_-]{43}\.ics$/) }),
  },
  responses: {
    200: { description: 'The calendar, as text/calendar' },
    404: {
      description: 'No such link, or it has been replaced or turned off',
      content: { 'application/json': { schema: CalendarFeedRefusal } },
    },
  },
});

export {
  calendarFeedRoute,
  ensureCalendarFeedRoute,
  readCalendarFeedRoute,
  renewCalendarFeedRoute,
  stopCalendarFeedRoute,
};
