import { createRoute } from '@hono/zod-openapi';
import {
  PasswordResetRequestedSchema,
  PasswordResetRequestSchema,
} from '@ValenceContracts/schemas/PasswordResetRequest';

const Request = PasswordResetRequestSchema.openapi('PasswordResetRequest');

const Requested = PasswordResetRequestedSchema.openapi('PasswordResetRequested');

const requestPasswordResetRoute = createRoute({
  method: 'post',
  path: '/api/password-reset',
  tags: ['Accounts'],
  summary: 'Ask for a password reset link, by username, email address or the face somebody picked',
  description:
    'Answers the same whether or not an account answers to what was given, and asks at most once a minute for any one account. The link is emailed when email is on for password resets and the account has an address, and is always written to the server log.',
  request: { body: { content: { 'application/json': { schema: Request } } } },
  responses: {
    202: {
      description: 'Taken; a link is on its way if an account answers to it',
      content: { 'application/json': { schema: Requested } },
    },
  },
});

export { requestPasswordResetRoute };
