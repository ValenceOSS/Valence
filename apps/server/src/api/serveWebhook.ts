import { isIP } from 'node:net';
import { bodyOf } from '@ValenceI18n/bodyOf';
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
import { refusalOfWebhookAddress } from '@ValenceServer/webhooks/refusalOfWebhookAddress';
import { missingAddressSettings } from '@ValenceContracts/functions/missingAddressSettings';
import { queueWebhookTest } from '@ValenceServer/webhooks/queueWebhookTest';
import { queueWebhookRedelivery } from '@ValenceServer/webhooks/queueWebhookRedelivery';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';
import { DEFAULT_CUSTOM_WEBHOOK } from '@ValenceContracts/constants/DEFAULT_CUSTOM_WEBHOOK';
import { renderWebhookTemplate } from '@ValenceContracts/functions/renderWebhookTemplate';
import { templateProblemKey } from '@ValenceServer/webhooks/templateProblemKey';
import type { CustomWebhook } from '@ValenceContracts/schemas/Webhook';

/**
 * What is wrong with a Custom webhook's template that no event could fix, read by filling it with
 * nothing.
 *
 * @param custom - The setup asked for, where one was.
 * @returns The refusal to give, or nothing where the template can be filled.
 */
const templateRefusalOf = (custom: CustomWebhook | null | undefined) => {
  const problem =
    custom === null || custom === undefined
      ? null
      : renderWebhookTemplate(custom.template, custom.format, {}).problem;

  return problem === null ? null : refuse(templateProblemKey(problem));
};

/**
 * Why a webhook may not be sent to an address written as an IP, judged now because no name lookup
 * will ever see it.
 *
 * @param url - The address asked for.
 * @param reachesLocalNetwork - Whether the webhook is allowed to reach the local network.
 * @returns The refusal to give, or nothing where the address is a name or is allowed.
 */
const literalAddressRefusalOf = (url: string, reachesLocalNetwork: boolean) => {
  const host = URL.parse(url)?.hostname.replace(/^\[|\]$/g, '') ?? '';

  const key = isIP(host) === 0 ? null : refusalOfWebhookAddress([host], reachesLocalNetwork);

  return key === null ? null : refuse(key);
};

/**
 * Registers the webhook endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveWebhook = (app: OpenAPIHono, context: AppContext): void => {
  const { webhooks, queueWebhookDelivery, readWebhookKeeper, refuseWebhookKeeper, recordAudit } =
    context;

  app.openapi(listWebhooksRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json(bodyOf(refusal), refusal.status);
    }

    return context.json({ webhooks: await webhooks.list() }, 200);
  });

  app.openapi(createWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json(bodyOf(refusal), refusal.status);
    }

    const asked = context.req.valid('json');

    if (!isSafeWebhookUrl(asked.url)) {
      return context.json(refuse('error.common.valenceWillNotSendDeliveriesTo'), 400);
    }

    const refusedLiteral = literalAddressRefusalOf(asked.url, asked.reachesLocalNetwork);

    if (refusedLiteral !== null) {
      return context.json(refusedLiteral, 400);
    }

    const missing = missingAddressSettings(asked.preset, asked.url);

    if (missing.length > 0) {
      return context.json(
        refuse('error.webhook.theAddressIsMissingSettings', { settings: missing.join(', ') }),
        400,
      );
    }

    const refusedTemplate = templateRefusalOf(asked.custom);

    if (refusedTemplate !== null) {
      return context.json(refusedTemplate, 400);
    }

    const made = await webhooks.create({
      ...asked,
      custom: asked.custom ?? (asked.preset === 'custom' ? DEFAULT_CUSTOM_WEBHOOK : null),
    });

    await recordAudit(context, 'webhook.added', made.subscription.name, {
      host: URL.parse(made.subscription.url)?.host ?? '',
    });

    return context.json({ ...made.subscription, secret: made.secret }, 201);
  });

  app.openapi(updateWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json(bodyOf(refusal), refusal.status);
    }

    const asked = context.req.valid('json');

    if (asked.url !== undefined && !isSafeWebhookUrl(asked.url)) {
      return context.json(refuse('error.common.valenceWillNotSendDeliveriesTo'), 400);
    }

    const refusedTemplate = templateRefusalOf(asked.custom);

    if (refusedTemplate !== null) {
      return context.json(refusedTemplate, 400);
    }

    const id = context.req.valid('param').id;
    const before =
      asked.url === undefined &&
      asked.preset === undefined &&
      asked.reachesLocalNetwork === undefined
        ? null
        : (await webhooks.list()).find((one) => one.id === id);
    const refusedLiteral =
      before === null || before === undefined
        ? null
        : literalAddressRefusalOf(
            asked.url ?? before.url,
            asked.reachesLocalNetwork ?? before.reachesLocalNetwork,
          );

    if (
      refusedLiteral !== null &&
      (asked.url !== undefined || asked.reachesLocalNetwork !== undefined)
    ) {
      return context.json(refusedLiteral, 400);
    }

    const isNewlyCustom =
      asked.preset === 'custom' && asked.custom === undefined && before?.custom === null;
    const missing =
      before === null ||
      before === undefined ||
      (asked.url === undefined && asked.preset === undefined)
        ? []
        : missingAddressSettings(asked.preset ?? before.preset, asked.url ?? before.url);

    if (missing.length > 0) {
      return context.json(
        refuse('error.webhook.theAddressIsMissingSettings', { settings: missing.join(', ') }),
        400,
      );
    }

    const changed = await webhooks.update(
      id,
      isNewlyCustom ? { ...asked, custom: DEFAULT_CUSTOM_WEBHOOK } : asked,
    );

    if (changed !== null) {
      await recordAudit(context, 'webhook.changed', changed.name);
    }

    return changed === null
      ? context.json(refuse('error.webhook.noSuchSubscription'), 404)
      : context.json(changed, 200);
  });

  app.openapi(deleteWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json(bodyOf(refusal), refusal.status);
    }

    const removing = (await webhooks.list()).find(
      (one) => one.id === context.req.valid('param').id,
    );

    if (!(await webhooks.remove(context.req.valid('param').id))) {
      return context.json(refuse('error.webhook.noSuchSubscription'), 404);
    }

    await recordAudit(context, 'webhook.removed', removing?.name ?? null);

    return context.body(null, 204);
  });

  app.openapi(testWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json(bodyOf(refusal), refusal.status);
    }

    const queued = await queueWebhookTest({
      subscriptions: webhooks,
      subscriptionId: context.req.valid('param').id,
      enqueue: queueWebhookDelivery,
    });

    return queued
      ? context.json({ queued }, 202)
      : context.json(refuse('error.webhook.noSuchSubscriptionOrItIs'), 404);
  });

  app.openapi(listWebhookDeliveriesRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json(bodyOf(refusal), refusal.status);
    }

    const { id } = context.req.valid('param');

    const exists = (await webhooks.list()).some((webhook) => webhook.id === id);

    if (!exists) {
      return context.json(refuse('error.webhook.noSuchSubscription'), 404);
    }

    return context.json({ deliveries: await webhooks.listDeliveries(id, DELIVERY_PAGE) }, 200);
  });

  app.openapi(redeliverWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json(bodyOf(refusal), refusal.status);
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
      : context.json(refuse('error.webhook.noSuchDeliveryOrTheSubscription'), 404);
  });
};

export { serveWebhook };
