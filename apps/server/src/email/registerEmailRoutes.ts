import {
  readEmailRoute,
  saveEmailRoute,
  sendTestEmailRoute,
} from '@ValenceServer/routes/EmailRoute';
import { refuse } from '@ValenceI18n/refuse';
import { saying } from '@ValenceI18n/saying';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { EmailService } from './EmailService';

const MAY_NOT = refuse('common.thatIsForAdministrators');

type EmailRouteOptions = {
  email: EmailService;
  requires: (headers: Headers, permission: Permission) => Promise<boolean>;
};

/**
 * Puts the email settings on the API for administrators who may change the server's settings:
 * reading them, saving them, and sending a test.
 *
 * @param app - The application to register on.
 * @param options - The email service and how to check a permission.
 */
const registerEmailRoutes = (app: OpenAPIHono, { email, requires }: EmailRouteOptions): void => {
  app.openapi(readEmailRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(MAY_NOT, 403);
    }

    return context.json(await email.setup(), 200);
  });

  app.openapi(saveEmailRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(MAY_NOT, 403);
    }

    return context.json(await email.change(context.req.valid('json')), 200);
  });

  app.openapi(sendTestEmailRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(MAY_NOT, 403);
    }

    const outcome = await email.sendTest(context.req.valid('json').to);

    if (outcome.kind === 'sent') {
      return context.json({ sent: true, problem: null }, 200);
    }

    return context.json(
      {
        sent: false,
        problem:
          outcome.kind === 'failed'
            ? outcome.problem
            : saying('server.email.createEmailService.thereIsNoMailServer'),
      },
      200,
    );
  });
};

export type { EmailRouteOptions };

export { registerEmailRoutes };
