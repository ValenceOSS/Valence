import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  FetchedSubtitleSchema,
  FoundSubtitlesSchema,
  SubtitleChoiceSchema,
  SubtitleSetupChangeSchema,
  SubtitleSetupSchema,
} from '@ValenceContracts/schemas/SubtitleFinding';

const SubtitleError = RefusalSchema.openapi('SubtitleFindingError');

const Setup = SubtitleSetupSchema.openapi('SubtitleSetup');

const refused = (description: string) => ({
  description,
  content: { 'application/json': { schema: SubtitleError } },
});

const readSubtitleSetupRoute = createRoute({
  method: 'get',
  path: '/api/admin/subtitles',
  tags: ['Admin'],
  summary: 'Read where Valence finds subtitles and in which languages',
  responses: {
    200: {
      description: 'Which sites have a key, the account signed in with, and the languages wanted',
      content: { 'application/json': { schema: Setup } },
    },
    403: refused('Subtitle settings are for administrators who may change the server settings'),
  },
});

const saveSubtitleSetupRoute = createRoute({
  method: 'put',
  path: '/api/admin/subtitles',
  tags: ['Admin'],
  summary: 'Change where Valence finds subtitles; an empty key or password keeps the one saved',
  request: {
    body: {
      content: {
        'application/json': { schema: SubtitleSetupChangeSchema.openapi('SubtitleSetupChange') },
      },
    },
  },
  responses: {
    200: {
      description: 'The subtitle settings as saved',
      content: { 'application/json': { schema: Setup } },
    },
    403: refused('Subtitle settings are for administrators who may change the server settings'),
  },
});

const findSubtitlesRoute = createRoute({
  method: 'get',
  path: '/api/media/{id}/subtitles/found',
  tags: ['Library'],
  summary: 'Look for subtitles for a film or episode in one language',
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: z.object({ language: z.string().min(2).max(3) }),
  },
  responses: {
    200: {
      description: 'What the subtitle sites have, those timed to this very file first',
      content: { 'application/json': { schema: FoundSubtitlesSchema.openapi('FoundSubtitles') } },
    },
    403: refused('Not somebody who may change what the library holds'),
    404: refused('No such item'),
  },
});

const fetchSubtitleRoute = createRoute({
  method: 'post',
  path: '/api/media/{id}/subtitles/found',
  tags: ['Library'],
  summary: 'Fetch one subtitle that was found, and keep it beside the video',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: SubtitleChoiceSchema.openapi('SubtitleChoice') } },
    },
  },
  responses: {
    200: {
      description: 'The name it was kept under, beside the video',
      content: {
        'application/json': { schema: FetchedSubtitleSchema.openapi('FetchedSubtitle') },
      },
    },
    400: refused('No key is saved for that site'),
    403: refused(
      'Not somebody who may change what the library holds, or the disk would not let it',
    ),
    404: refused('No such item'),
    502: refused('The site would not give it, such as when the day’s downloads are used up'),
  },
});

export { fetchSubtitleRoute, findSubtitlesRoute, readSubtitleSetupRoute, saveSubtitleSetupRoute };
