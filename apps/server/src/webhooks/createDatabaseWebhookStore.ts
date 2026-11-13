import { randomBytes, randomUUID } from 'node:crypto';
import { and, asc, desc, eq, lt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { countAffected } from '@ValenceDatabase/countAffected';
import { upsert } from '@ValenceDatabase/upsert';
import { toIso } from '@ValenceCore/functions/toIso';
import { webhookDelivery, webhookSubscription } from '#dialect/Schema';
import {
  CustomWebhookSchema,
  DEFAULT_WEBHOOK_FILTERS,
  WebhookEventSchema,
  WebhookFiltersSchema,
  WebhookPresetSchema,
} from '@ValenceContracts/schemas/Webhook';
import { blankSecretHeaders } from './blankSecretHeaders';
import { keepSecretHeaders } from './keepSecretHeaders';
import { subscriptionWants } from './subscriptionWants';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { CustomWebhook, WebhookSubscription } from '@ValenceContracts/schemas/Webhook';
import type { WebhookStore } from './WebhookStore';

const WEBHOOK_SECRET_PREFIX = 'whsec_';

const WEBHOOK_SECRET_BYTES = 32;

const StoredEventsSchema = z.array(WebhookEventSchema);

/**
 * Reads a Custom webhook's setup from the column that holds it, taking anything it cannot read as no
 * setup at all rather than losing the whole subscription.
 *
 * @param row - The subscription's row.
 * @returns The setup, or nothing.
 */
const customOf = (row: typeof webhookSubscription.$inferSelect): CustomWebhook | null => {
  const read = CustomWebhookSchema.safeParse(row.custom);

  return read.success ? read.data : null;
};

/**
 * Webhook subscriptions and their delivery history, held in the database — who asked about what, and
 * what happened when Valence tried to tell them.
 *
 * @param db - The database to read and write.
 * @returns The webhook store.
 */
const createDatabaseWebhookStore = (db: AnyValenceDatabase): WebhookStore => {
  const readRow = (row: typeof webhookSubscription.$inferSelect): WebhookSubscription[] => {
    const events = StoredEventsSchema.safeParse(row.events);
    const preset = WebhookPresetSchema.safeParse(row.preset);
    const filters = WebhookFiltersSchema.safeParse(row.filters);

    if (!events.success || !preset.success || events.data.length === 0) {
      return [];
    }

    return [
      {
        id: row.id,
        name: row.name,
        url: row.url,
        preset: preset.data,
        events: events.data,
        filters: filters.success ? filters.data : DEFAULT_WEBHOOK_FILTERS,
        custom: blankSecretHeaders(customOf(row)),
        reachesLocalNetwork: row.reachesLocalNetwork,
        enabled: row.enabled,
        createdAt: row.createdAt.toISOString(),
        lastAttemptAt: toIso(row.lastAttemptAt),
        lastStatus: row.lastStatus,
        lastError: row.lastError,
      },
    ];
  };

  return {
    list: async () => {
      const rows = await db
        .select()
        .from(webhookSubscription)
        .orderBy(asc(webhookSubscription.createdAt));

      return rows.flatMap((row) => readRow(row));
    },

    create: async ({
      name,
      url,
      preset,
      events,
      filters = DEFAULT_WEBHOOK_FILTERS,
      custom = null,
      reachesLocalNetwork = false,
    }) => {
      const id = randomUUID();
      const secret = `${WEBHOOK_SECRET_PREFIX}${randomBytes(WEBHOOK_SECRET_BYTES).toString('base64url')}`;
      const createdAt = new Date();

      await db.insert(webhookSubscription).values({
        id,
        name,
        url,
        secret,
        preset,
        events,
        filters,
        custom,
        reachesLocalNetwork,
        enabled: true,
        createdAt,
      });

      return {
        secret,
        subscription: {
          id,
          name,
          url,
          preset,
          events,
          filters,
          custom: blankSecretHeaders(custom),
          reachesLocalNetwork,
          enabled: true,
          createdAt: createdAt.toISOString(),
          lastAttemptAt: null,
          lastStatus: null,
          lastError: null,
        },
      };
    },

    update: async (id, change) => {
      const changed = await db.transaction(async (transaction) => {
        const stored =
          change.custom === undefined || change.custom === null
            ? null
            : ((
                await transaction
                  .select()
                  .from(webhookSubscription)
                  .where(eq(webhookSubscription.id, id))
              ).map(customOf)[0] ?? null);

        await transaction
          .update(webhookSubscription)
          .set({
            ...(change.name === undefined ? {} : { name: change.name }),
            ...(change.url === undefined ? {} : { url: change.url }),
            ...(change.preset === undefined ? {} : { preset: change.preset }),
            ...(change.events === undefined ? {} : { events: change.events }),
            ...(change.filters === undefined ? {} : { filters: change.filters }),
            ...(change.custom === undefined
              ? {}
              : {
                  custom: change.custom === null ? null : keepSecretHeaders(change.custom, stored),
                }),
            ...(change.enabled === undefined ? {} : { enabled: change.enabled }),
            ...(change.reachesLocalNetwork === undefined
              ? {}
              : { reachesLocalNetwork: change.reachesLocalNetwork }),
          })
          .where(eq(webhookSubscription.id, id));

        return transaction.select().from(webhookSubscription).where(eq(webhookSubscription.id, id));
      });

      return changed.flatMap((row) => readRow(row))[0] ?? null;
    },

    remove: async (id) => {
      const removed = await db.delete(webhookSubscription).where(eq(webhookSubscription.id, id));

      return countAffected(removed) > 0;
    },

    listenersFor: async (occurrence) => {
      const rows = await db
        .select()
        .from(webhookSubscription)
        .where(eq(webhookSubscription.enabled, true));

      return rows
        .flatMap((row) => readRow(row))
        .filter((subscription) => subscriptionWants(subscription, occurrence))
        .map((subscription) => subscription.id);
    },

    readTarget: async (id) => {
      const rows = await db
        .select()
        .from(webhookSubscription)
        .where(and(eq(webhookSubscription.id, id), eq(webhookSubscription.enabled, true)));

      const row = rows[0];

      if (row === undefined) {
        return null;
      }

      const preset = WebhookPresetSchema.safeParse(row.preset);

      return preset.success
        ? {
            url: row.url,
            preset: preset.data,
            secret: row.secret,
            custom: customOf(row),
            reachesLocalNetwork: row.reachesLocalNetwork,
          }
        : null;
    },

    recordAttempt: async (id, attempt) => {
      await db
        .update(webhookSubscription)
        .set({
          lastAttemptAt: new Date(),
          lastStatus: attempt.status,
          lastError: attempt.error,
        })
        .where(eq(webhookSubscription.id, id));
    },

    recordDelivery: async ({ subscriptionId, eventId, event, body }, attempt) => {
      const at = new Date();

      await upsert(db, webhookDelivery, {
        values: [
          {
            id: randomUUID(),
            subscriptionId,
            eventId,
            event,
            body,
            attempts: 1,
            firstAttemptAt: at,
            lastAttemptAt: at,
            ok: attempt.ok,
            status: attempt.status,
            error: attempt.error,
          },
        ],
        target: [webhookDelivery.subscriptionId, webhookDelivery.eventId],
        set: {
          attempts: sql`${webhookDelivery.attempts} + 1`,
          lastAttemptAt: at,
          ok: attempt.ok,
          status: attempt.status,
          error: attempt.error,
        },
      });
    },

    listDeliveries: async (subscriptionId, limit) => {
      const rows = await db
        .select()
        .from(webhookDelivery)
        .where(eq(webhookDelivery.subscriptionId, subscriptionId))
        .orderBy(desc(webhookDelivery.lastAttemptAt))
        .limit(limit);

      return rows.flatMap((row) => {
        const event = WebhookEventSchema.safeParse(row.event);

        return event.success
          ? [
              {
                id: row.id,
                subscriptionId: row.subscriptionId,
                event: event.data,
                attempts: row.attempts,
                firstAttemptAt: row.firstAttemptAt.toISOString(),
                lastAttemptAt: row.lastAttemptAt.toISOString(),
                ok: row.ok,
                status: row.status,
                error: row.error,
              },
            ]
          : [];
      });
    },

    readDeliveryBody: async (subscriptionId, deliveryId) => {
      const rows = await db
        .select({ body: webhookDelivery.body })
        .from(webhookDelivery)
        .where(
          and(
            eq(webhookDelivery.id, deliveryId),
            eq(webhookDelivery.subscriptionId, subscriptionId),
          ),
        );

      return rows[0]?.body ?? null;
    },

    pruneDeliveries: async (before) => {
      const removed = await db
        .delete(webhookDelivery)
        .where(lt(webhookDelivery.lastAttemptAt, before));

      return countAffected(removed);
    },
  };
};

export { createDatabaseWebhookStore };
