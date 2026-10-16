import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  PreRollChangeSchema,
  PreRollChoiceSchema,
  PreRollSetupSchema,
} from '@ValenceContracts/schemas/PreRoll';

const PreRollError = RefusalSchema.openapi('PreRollError');

const Setup = PreRollSetupSchema.openapi('PreRollSetup');

const refused = (description: string) => ({
  description,
  content: { 'application/json': { schema: PreRollError } },
});

const readPreRollSetupRoute = createRoute({
  method: 'get',
  path: '/api/admin/pre-roll',
  tags: ['Admin'],
  summary: 'Read whether a clip plays before films and episodes, and which clips there are',
  responses: {
    200: {
      description: 'The pre-roll settings, and the clips found in the folder',
      content: { 'application/json': { schema: Setup } },
    },
    403: refused('Pre-roll is for administrators who may change the server settings'),
  },
});

const savePreRollSetupRoute = createRoute({
  method: 'put',
  path: '/api/admin/pre-roll',
  tags: ['Admin'],
  summary: 'Change whether a clip plays before films and episodes, and where the clips are',
  request: {
    body: {
      content: {
        'application/json': { schema: PreRollChangeSchema.openapi('PreRollChange') },
      },
    },
  },
  responses: {
    200: {
      description: 'The pre-roll settings as saved, and the clips found in the folder',
      content: { 'application/json': { schema: Setup } },
    },
    400: refused('The folder is not a whole path'),
    403: refused('Pre-roll is for administrators who may change the server settings'),
  },
});

const choosePreRollRoute = createRoute({
  method: 'get',
  path: '/api/media/{mediaId}/pre-roll',
  tags: ['Playback'],
  summary: 'Choose the clip to play before a film or episode, where one should play',
  request: {
    params: z.object({ mediaId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'The clip, or nothing',
      content: { 'application/json': { schema: PreRollChoiceSchema.openapi('PreRollChoice') } },
    },
    404: refused('No such media item'),
  },
});

const preRollClipRoute = createRoute({
  method: 'get',
  path: '/api/pre-roll/{clipId}',
  tags: ['Playback'],
  summary: 'Stream a pre-roll clip',
  request: {
    params: z.object({ clipId: z.string().regex(/^[0-9a-f]{16}$/u) }),
  },
  responses: {
    200: { description: 'The whole clip' },
    206: { description: 'The requested byte range' },
    404: refused('No such clip'),
  },
});

export { choosePreRollRoute, preRollClipRoute, readPreRollSetupRoute, savePreRollSetupRoute };
