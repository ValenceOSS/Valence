import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  DeviceRenameSchema,
  SignedInDeviceListSchema,
} from '@ValenceContracts/schemas/SignedInDevice';

const DeviceError = RefusalSchema.openapi('DeviceError');

const DeviceListSchema = SignedInDeviceListSchema.openapi('DeviceList');

const listDevicesRoute = createRoute({
  method: 'get',
  path: '/api/account/devices',
  tags: ['Account'],
  summary: 'List everywhere this account is signed in',
  responses: {
    200: {
      description: 'The sessions this account holds',
      content: { 'application/json': { schema: DeviceListSchema } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: DeviceError } },
    },
  },
});

const endDeviceRoute = createRoute({
  method: 'delete',
  path: '/api/account/devices/{id}',
  tags: ['Account'],
  summary: 'Sign a device out',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Signed out' },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: DeviceError } },
    },
  },
});

const renameDeviceRoute = createRoute({
  method: 'put',
  path: '/api/account/devices/{id}/name',
  tags: ['Account'],
  summary: 'Rename a device, or give it back the name it has of its own',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: DeviceRenameSchema } } },
  },
  responses: {
    204: { description: 'Renamed' },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: DeviceError } },
    },
    404: {
      description: 'No such device',
      content: { 'application/json': { schema: DeviceError } },
    },
  },
});

const AskingDeviceSchema = z
  .object({ device: SaidSchema, client: SaidSchema, address: z.string().nullable() })
  .openapi('AskingDevice');

const askingDeviceRoute = createRoute({
  method: 'get',
  path: '/api/account/devices/asking/{userCode}',
  tags: ['Account'],
  summary: 'Say which device is asking to be signed in with a code',
  request: { params: z.object({ userCode: z.string().min(1).max(64) }) },
  responses: {
    200: {
      description: 'The device that asked for the code',
      content: { 'application/json': { schema: AskingDeviceSchema } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: DeviceError } },
    },
    404: {
      description: 'No device asked for that code, or it has run out',
      content: { 'application/json': { schema: DeviceError } },
    },
  },
});

const endOtherDevicesRoute = createRoute({
  method: 'post',
  path: '/api/account/devices/end-others',
  tags: ['Account'],
  summary: 'Sign out everywhere else',
  responses: {
    204: { description: 'Signed out everywhere else' },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: DeviceError } },
    },
  },
});

export {
  askingDeviceRoute,
  listDevicesRoute,
  endDeviceRoute,
  endOtherDevicesRoute,
  renameDeviceRoute,
};
