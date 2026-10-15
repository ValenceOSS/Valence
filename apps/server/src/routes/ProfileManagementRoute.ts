import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  ViewerProfileSchema,
  ViewerProfileRequestSchema,
  ViewerProfileListSchema,
} from '@ValenceContracts/schemas/ViewerProfile';
import {
  ChooseProfileSchema,
  ProfileChoiceRefusalSchema,
  ProfilePinChangeSchema,
} from '@ValenceContracts/schemas/ProfilePin';
import {
  MayRequestSchema,
  ProfileCeilingRequestSchema,
  ProfileLibrariesSchema,
} from '@ValenceContracts/schemas/ProfileLibraries';

const ManagementError = RefusalSchema.openapi('ProfileManagementError');

const refusals = {
  400: {
    description: 'That could not be read',
    content: { 'application/json': { schema: ManagementError } },
  },
  401: {
    description: 'Not signed in',
    content: { 'application/json': { schema: ManagementError } },
  },
  403: {
    description: 'Only the account’s owner, or an administrator, may do that',
    content: { 'application/json': { schema: ManagementError } },
  },
  404: {
    description: 'No such profile on this account',
    content: { 'application/json': { schema: ManagementError } },
  },
  409: {
    description: 'Not to the owner’s profile, or not without a PIN',
    content: { 'application/json': { schema: ManagementError } },
  },
  429: {
    description: 'Too many wrong PINs for now',
    content: { 'application/json': { schema: ManagementError } },
  },
};

/**
 * Describes the routes that manage the profiles on one account, at whichever address they are
 * reached: the account's own, for its owner and each profile acting for itself, or an
 * administrator's, for any account.
 *
 * @param base - Where the account's profiles are listed.
 * @param tag - Which part of the reference they belong to.
 * @param shape - What else the address names.
 * @returns The routes.
 */
const profileManagementRoutes = <Shape extends z.ZodRawShape>(
  base: string,
  tag: string,
  shape: Shape,
) => {
  const account = z.object(shape);
  const one = z.object({ ...shape, profileId: z.string().uuid() });
  const shelf = z.object({ ...shape, profileId: z.string().uuid(), libraryId: z.string().min(1) });

  return {
    list: createRoute({
      method: 'get',
      path: base,
      tags: [tag],
      summary: 'List the profiles on an account',
      request: { params: account },
      responses: {
        200: {
          description: 'The profiles',
          content: { 'application/json': { schema: ViewerProfileListSchema } },
        },
        ...refusals,
      },
    }),
    create: createRoute({
      method: 'post',
      path: base,
      tags: [tag],
      summary: 'Add a profile to an account',
      request: {
        params: account,
        body: { content: { 'application/json': { schema: ViewerProfileRequestSchema } } },
      },
      responses: {
        201: {
          description: 'The profile that was added',
          content: { 'application/json': { schema: ViewerProfileSchema } },
        },
        ...refusals,
      },
    }),
    update: createRoute({
      method: 'patch',
      path: `${base}/{profileId}`,
      tags: [tag],
      summary: 'Rename or recolour a profile',
      request: {
        params: one,
        body: { content: { 'application/json': { schema: ViewerProfileRequestSchema } } },
      },
      responses: { 204: { description: 'Changed' }, ...refusals },
    }),
    remove: createRoute({
      method: 'delete',
      path: `${base}/{profileId}`,
      tags: [tag],
      summary: 'Remove a profile, and everything it watched',
      request: { params: one },
      responses: { 204: { description: 'Removed' }, ...refusals },
    }),
    pin: createRoute({
      method: 'put',
      path: `${base}/{profileId}/pin`,
      tags: [tag],
      summary: 'Set, change or remove the PIN a profile is chosen with',
      request: {
        params: one,
        body: { content: { 'application/json': { schema: ProfilePinChangeSchema } } },
      },
      responses: { 204: { description: 'Changed' }, ...refusals },
    }),
    mayRequest: createRoute({
      method: 'put',
      path: `${base}/{profileId}/may-request`,
      tags: [tag],
      summary: 'Let a profile ask for things, or stop it',
      request: {
        params: one,
        body: { content: { 'application/json': { schema: MayRequestSchema } } },
      },
      responses: { 204: { description: 'Changed' }, ...refusals },
    }),
    owner: createRoute({
      method: 'post',
      path: `${base}/{profileId}/owner`,
      tags: [tag],
      summary: 'Make a profile the account’s owner',
      request: { params: one },
      responses: { 204: { description: 'Handed over' }, ...refusals },
    }),
    libraries: createRoute({
      method: 'get',
      path: `${base}/{profileId}/libraries`,
      tags: [tag],
      summary: 'What a profile may watch, within what its account may',
      request: { params: one },
      responses: {
        200: {
          description: 'Each library the account reaches, and the profile’s limits in it',
          content: { 'application/json': { schema: ProfileLibrariesSchema } },
        },
        ...refusals,
      },
    }),
    allowLibrary: createRoute({
      method: 'put',
      path: `${base}/{profileId}/libraries/{libraryId}`,
      tags: [tag],
      summary: 'Let a profile reach a library',
      request: { params: shelf },
      responses: { 204: { description: 'Allowed' }, ...refusals },
    }),
    refuseLibrary: createRoute({
      method: 'delete',
      path: `${base}/{profileId}/libraries/{libraryId}`,
      tags: [tag],
      summary: 'Keep a profile out of a library',
      request: { params: shelf },
      responses: { 204: { description: 'Refused' }, ...refusals },
    }),
    setCeiling: createRoute({
      method: 'put',
      path: `${base}/{profileId}/libraries/{libraryId}/ceiling`,
      tags: [tag],
      summary: 'Cap the age of what a profile sees in a library',
      request: {
        params: shelf,
        body: { content: { 'application/json': { schema: ProfileCeilingRequestSchema } } },
      },
      responses: { 204: { description: 'Capped' }, ...refusals },
    }),
    clearCeiling: createRoute({
      method: 'delete',
      path: `${base}/{profileId}/libraries/{libraryId}/ceiling`,
      tags: [tag],
      summary: 'Lift a profile’s age cap in a library',
      request: { params: shelf },
      responses: { 204: { description: 'Lifted' }, ...refusals },
    }),
  };
};

const chooseProfileRoute = createRoute({
  method: 'post',
  path: '/api/profiles/{profileId}/choose',
  tags: ['Profiles'],
  summary: 'Choose who is watching on this device, with the profile’s PIN where it has one',
  request: {
    params: z.object({ profileId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: ChooseProfileSchema.extend({ password: z.string().min(1).max(200).optional() }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'The profile now acting for this device',
      content: { 'application/json': { schema: ViewerProfileSchema } },
    },
    400: {
      description: 'A password was sent without a new PIN',
      content: { 'application/json': { schema: ProfileChoiceRefusalSchema } },
    },
    401: {
      description: 'The PIN is missing or wrong',
      content: { 'application/json': { schema: ProfileChoiceRefusalSchema } },
    },
    403: {
      description: 'An API key acts for its own profile',
      content: { 'application/json': { schema: ProfileChoiceRefusalSchema } },
    },
    404: {
      description: 'No such profile on this account',
      content: { 'application/json': { schema: ProfileChoiceRefusalSchema } },
    },
    409: {
      description: 'The owner needs a PIN first',
      content: { 'application/json': { schema: ProfileChoiceRefusalSchema } },
    },
    429: {
      description: 'Too many wrong PINs for now',
      content: { 'application/json': { schema: ProfileChoiceRefusalSchema } },
    },
  },
});

const forgetChosenProfileRoute = createRoute({
  method: 'delete',
  path: '/api/profiles/chosen',
  tags: ['Profiles'],
  summary: 'Lock this device’s profile, so somebody has to choose again',
  responses: {
    204: { description: 'Locked' },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: ManagementError } },
    },
  },
});

const ownProfileRoutes = profileManagementRoutes('/api/profiles', 'Profiles', {});

const accountProfileRoutes = profileManagementRoutes(
  '/api/admin/accounts/{userId}/profiles',
  'Admin',
  { userId: z.string().min(1) },
);

export { accountProfileRoutes, chooseProfileRoute, forgetChosenProfileRoute, ownProfileRoutes };
