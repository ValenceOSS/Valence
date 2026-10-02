import { createRoute } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  EmailSetupChangeSchema,
  EmailSetupSchema,
  EmailTestRequestSchema,
  EmailTestResultSchema,
} from '@ValenceContracts/schemas/EmailSetup';

const EmailError = RefusalSchema.openapi('EmailError');

const Setup = EmailSetupSchema.openapi('EmailSetup');

const Change = EmailSetupChangeSchema.openapi('EmailSetupChange');

const TestRequest = EmailTestRequestSchema.openapi('EmailTestRequest');

const TestResult = EmailTestResultSchema.openapi('EmailTestResult');

const refused = {
  403: {
    description: 'Email settings are for administrators who may change the server settings',
    content: { 'application/json': { schema: EmailError } },
  },
};

const readEmailRoute = createRoute({
  method: 'get',
  path: '/api/admin/email',
  tags: ['Admin'],
  summary: 'Read how Valence sends email, and the emails it has tried lately',
  responses: {
    200: {
      description: 'The mail server and sender, whether a password is set, and the latest sends',
      content: { 'application/json': { schema: Setup } },
    },
    ...refused,
  },
});

const saveEmailRoute = createRoute({
  method: 'put',
  path: '/api/admin/email',
  tags: ['Admin'],
  summary: 'Change how Valence sends email; an empty password keeps the one saved',
  request: { body: { content: { 'application/json': { schema: Change } } } },
  responses: {
    200: {
      description: 'The email settings as saved',
      content: { 'application/json': { schema: Setup } },
    },
    ...refused,
  },
});

const sendTestEmailRoute = createRoute({
  method: 'post',
  path: '/api/admin/email/test',
  tags: ['Admin'],
  summary: 'Send a test email through the saved mail server',
  request: { body: { content: { 'application/json': { schema: TestRequest } } } },
  responses: {
    200: {
      description: 'Whether it was sent, and why not when it was not',
      content: { 'application/json': { schema: TestResult } },
    },
    ...refused,
  },
});

export { readEmailRoute, saveEmailRoute, sendTestEmailRoute };
