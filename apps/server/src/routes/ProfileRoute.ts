import { createRoute, z } from '@hono/zod-openapi';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { ViewerProfileSchema } from '@ValenceContracts/schemas/ViewerProfile';

const ProfileError = RefusalSchema.openapi('ProfileError');

const ProfileSchema = ViewerProfileSchema.openapi('ViewerProfile');

const PromoteRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(MINIMUM_PASSWORD_LENGTH),
  })
  .openapi('PromoteProfileRequest');

const promoteProfileRoute = createRoute({
  method: 'post',
  path: '/api/admin/profiles/{profileId}/promote',
  tags: ['Admin'],
  summary: 'Give a profile an account of its own',
  request: {
    params: z.object({ profileId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: PromoteRequestSchema } } },
  },
  responses: {
    200: {
      description: 'The profile, now on its own account',
      content: { 'application/json': { schema: ProfileSchema } },
    },
    403: {
      description: 'Not an administrator',
      content: { 'application/json': { schema: ProfileError } },
    },
    404: {
      description: 'No such profile',
      content: { 'application/json': { schema: ProfileError } },
    },
    409: {
      description: 'That address already has an account',
      content: { 'application/json': { schema: ProfileError } },
    },
    500: {
      description: 'The account could not be created for another reason, which the log says',
      content: { 'application/json': { schema: ProfileError } },
    },
  },
});

export { promoteProfileRoute };
