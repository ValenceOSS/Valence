import { createRoute, z } from '@hono/zod-openapi';
import {
  ReportNowWatchingSchema,
  SendVideoCommandSchema,
  VideoDeviceListSchema,
} from '@ValenceContracts/schemas/VideoRemote';

const VideoDeviceError = z.object({ error: z.string() }).openapi('VideoDeviceError');

const json = <Schema extends z.ZodType>(description: string, schema: Schema) => ({
  description,
  content: { 'application/json': { schema } },
});

const refused = {
  401: json('Not signed in', VideoDeviceError),
  404: json('That device is not one of yours, or is not there', VideoDeviceError),
};

const listVideoDevicesRoute = createRoute({
  method: 'get',
  path: '/api/video/devices',
  tags: ['Playback'],
  summary:
    'Every copy of Valence your profile has open, what kind each is, and what each is watching',
  responses: {
    200: json('The devices', VideoDeviceListSchema.openapi('VideoDeviceList')),
    401: json('Not signed in', VideoDeviceError),
  },
});

const reportNowWatchingRoute = createRoute({
  method: 'post',
  path: '/api/video/devices/now-watching',
  tags: ['Playback'],
  summary: 'Say what this device is watching, so your other devices can show and control it',
  request: {
    body: { content: { 'application/json': { schema: ReportNowWatchingSchema } }, required: true },
  },
  responses: {
    200: json('Heard', z.object({ ok: z.boolean() })),
    ...refused,
  },
});

const commandVideoDeviceRoute = createRoute({
  method: 'post',
  path: '/api/video/devices/{clientId}/command',
  tags: ['Playback'],
  summary: 'Tell another of your devices to play a film, or pause, move or stop what it is playing',
  request: {
    params: z.object({ clientId: z.string().min(1).max(120) }),
    body: { content: { 'application/json': { schema: SendVideoCommandSchema } }, required: true },
  },
  responses: {
    200: json('Sent', z.object({ ok: z.boolean() })),
    ...refused,
  },
});

export { commandVideoDeviceRoute, listVideoDevicesRoute, reportNowWatchingRoute };
