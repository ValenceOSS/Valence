import { createRoute } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  ArrImportAppliedSchema,
  ArrImportAskSchema,
  ArrImportPlanSchema,
  ArrWantedBatchSchema,
  ArrWantedOutcomeSchema,
} from '@ValenceContracts/schemas/ArrImport';

const ArrImportError = RefusalSchema.openapi('ArrImportError');

const FAILURES = {
  400: {
    description: 'That is not what this takes',
    content: { 'application/json': { schema: ArrImportError } },
  },
  403: {
    description: 'Not allowed to manage requesting',
    content: { 'application/json': { schema: ArrImportError } },
  },
  404: {
    description: 'Requesting is off: the requests service is not set up',
    content: { 'application/json': { schema: ArrImportError } },
  },
  502: {
    description: 'The requests service could not be heard',
    content: { 'application/json': { schema: ArrImportError } },
  },
};

const ASKED = { body: { content: { 'application/json': { schema: ArrImportAskSchema } } } };

const planArrImportRoute = createRoute({
  method: 'post',
  path: '/api/admin/imports/arr/plan',
  tags: ['Imports'],
  summary:
    'Read a Radarr, Sonarr, Lidarr, Prowlarr and Overseerr or Jellyseerr setup and say what bringing it in would do, changing nothing',
  request: ASKED,
  responses: {
    ...FAILURES,
    200: {
      description:
        'What would be brought in, what cannot be, which library each app fills, and every masked secret to type in again',
      content: { 'application/json': { schema: ArrImportPlanSchema.openapi('ArrImportPlan') } },
    },
  },
});

const applyArrImportRoute = createRoute({
  method: 'post',
  path: '/api/admin/imports/arr/apply',
  tags: ['Imports'],
  summary:
    'Bring a Radarr, Sonarr, Lidarr, Prowlarr and Overseerr or Jellyseerr setup in, reading from them and never changing them; safe to run again',
  request: ASKED,
  responses: {
    ...FAILURES,
    200: {
      description:
        'What was added and kept, how each library is now fulfilled, and what was being waited for, to ask for next',
      content: {
        'application/json': { schema: ArrImportAppliedSchema.openapi('ArrImportApplied') },
      },
    },
  },
});

const askArrWantedRoute = createRoute({
  method: 'post',
  path: '/api/admin/imports/arr/requests',
  tags: ['Imports'],
  summary:
    'Ask for some of what a brought-in setup was waiting for, as whoever asked for it there where Valence knows them',
  request: { body: { content: { 'application/json': { schema: ArrWantedBatchSchema } } } },
  responses: {
    ...FAILURES,
    200: {
      description:
        'How many were asked for, how many were asked for already, and what could not be',
      content: {
        'application/json': { schema: ArrWantedOutcomeSchema.openapi('ArrWantedOutcome') },
      },
    },
  },
});

export { applyArrImportRoute, askArrWantedRoute, planArrImportRoute };
