import { createRoute, z } from '@hono/zod-openapi';
import {
  HouseholdRequestSchema,
  HouseholdSchema,
  OnboardingSchema,
} from '@ValenceContracts/schemas/Household';

const HouseholdError = z.object({ error: z.string() }).openapi('HouseholdError');

const Household = HouseholdSchema.openapi('Household');
const Onboarding = OnboardingSchema.openapi('Onboarding');
const HouseholdRequest = HouseholdRequestSchema.openapi('HouseholdRequest');

const readOnboardingRoute = createRoute({
  method: 'get',
  path: '/api/account/onboarding',
  tags: ['Account'],
  summary: 'Whether this household has been set up, and what it looks like',
  responses: {
    200: {
      description: 'The household, and whether anybody has finished setting it up',
      content: { 'application/json': { schema: Onboarding } },
    },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: HouseholdError } },
    },
  },
});

const changeHouseholdRoute = createRoute({
  method: 'patch',
  path: '/api/account',
  tags: ['Account'],
  summary: 'Change what this household is called, or what it is drawn with',
  request: { body: { content: { 'application/json': { schema: HouseholdRequest } } } },
  responses: {
    200: {
      description: 'The household as it now stands',
      content: { 'application/json': { schema: Household } },
    },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: HouseholdError } },
    },
  },
});

const finishOnboardingRoute = createRoute({
  method: 'post',
  path: '/api/account/onboarding',
  tags: ['Account'],
  summary: 'Say that this household has been set up',
  responses: {
    204: { description: 'Recorded' },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: HouseholdError } },
    },
  },
});

export { readOnboardingRoute, changeHouseholdRoute, finishOnboardingRoute };
