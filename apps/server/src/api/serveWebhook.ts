import { say } from '@ValenceI18n/say';
import {
  listWebhooksRoute,
  createWebhookRoute,
  updateWebhookRoute,
  deleteWebhookRoute,
  testWebhookRoute,
  listWebhookDeliveriesRoute,
  redeliverWebhookRoute,
  DELIVERY_PAGE,
} from '@ValenceServer/routes/WebhookRoute';
import { isSafeWebhookUrl } from '@ValenceServer/webhooks/isSafeWebhookUrl';
import { queueWebhookTest } from '@ValenceServer/webhooks/queueWebhookTest';
import { queueWebhookRedelivery } from '@ValenceServer/webhooks/queueWebhookRedelivery';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the webhook endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveWebhook = (app: OpenAPIHono, context: AppContext): void => {
  const { webhooks, queueWebhookDelivery, readWebhookKeeper, refuseWebhookKeeper } = context;

  app.openapi(listWebhooksRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    return context.json({ webhooks: await webhooks.list() }, 200);
  });

  app.openapi(createWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    const asked = context.req.valid('json');

    if (!isSafeWebhookUrl(asked.url)) {
      return context.json({ error: say('server.errors.wontDeliverThere') }, 400);
    }

    const made = await webhooks.create(asked);

    return context.json({ ...made.subscription, secret: made.secret }, 201);
  });

  app.openapi(updateWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    const asked = context.req.valid('json');

    if (asked.url !== undefined && !isSafeWebhookUrl(asked.url)) {
      return context.json({ error: say('server.errors.wontDeliverThere') }, 400);
    }

    const changed = await webhooks.update(context.req.valid('param').id, asked);

    return changed === null
      ? context.json({ error: say('server.errors.noSuchSubscription') }, 404)
      : context.json(changed, 200);
  });

  app.openapi(deleteWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    if (!(await webhooks.remove(context.req.valid('param').id))) {
      return context.json({ error: say('server.errors.noSuchSubscription') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(testWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    const queued = await queueWebhookTest({
      subscriptions: webhooks,
      subscriptionId: context.req.valid('param').id,
      enqueue: queueWebhookDelivery,
    });

    return queued
      ? context.json({ queued }, 202)
      : context.json({ error: say('server.errors.noSuchSubscriptionOrOff') }, 404);
  });

  app.openapi(listWebhookDeliveriesRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    const { id } = context.req.valid('param');

    const exists = (await webhooks.list()).some((webhook) => webhook.id === id);

    if (!exists) {
      return context.json({ error: say('server.errors.noSuchSubscription') }, 404);
    }

    return context.json({ deliveries: await webhooks.listDeliveries(id, DELIVERY_PAGE) }, 200);
  });

  app.openapi(redeliverWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    const { id, deliveryId } = context.req.valid('param');

    const queued = await queueWebhookRedelivery({
      subscriptions: webhooks,
      subscriptionId: id,
      deliveryId,
      enqueue: queueWebhookDelivery,
    });

    return queued
      ? context.json({ queued }, 202)
      : context.json({ error: say('server.errors.noSuchDelivery') }, 404);
  });
};

export { serveWebhook };
