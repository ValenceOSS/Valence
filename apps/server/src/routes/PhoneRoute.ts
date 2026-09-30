import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';

const PhoneError = RefusalSchema.openapi('PhoneError');

const A_CHALLENGE = z.string().regex(/^[0-9a-f]{64}$/u);

const A_LOOPBACK_PORT = z.number().int().min(1024).max(65535);

const handBackRoute = createRoute({
  method: 'post',
  path: '/api/phone/hand-back',
  tags: ['Phone'],
  summary: 'Make a code to hand a browser sign-in back to an app',
  description:
    'Answered only to a POST from a page somebody has just signed in on, never to a link: a GET that minted codes could be aimed at any browser already signed in, and would hand its session to whatever caught the redirect. The code is kept against the challenge the app sent, so it is worth nothing without the secret only that app holds. The link goes back into the app by its own scheme, or, where a port is named, to that port on this machine alone, which is how a desktop app on Linux listens for it.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ challenge: A_CHALLENGE, port: A_LOOPBACK_PORT.optional() }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Where to send the browser, with the code on it',
      content: { 'application/json': { schema: z.object({ url: z.string() }) } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: PhoneError } },
    },
  },
});

const exchangeRoute = createRoute({
  method: 'post',
  path: '/api/phone/exchange',
  tags: ['Phone'],
  summary: 'Swap a handed-back code and its secret for a session on the phone',
  description:
    'The code is spent whether or not the secret is right, so it cannot be tried twice. Somebody who caught the code on its way back to the phone has the code and not the secret.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ code: z.string().min(1), secret: z.string().min(32).max(256) }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Signed in; the session cookie is set' },
    401: {
      description: 'The code or its secret was not right',
      content: { 'application/json': { schema: PhoneError } },
    },
  },
});

export { handBackRoute, exchangeRoute };
