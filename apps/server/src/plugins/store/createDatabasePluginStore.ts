import { and, asc, eq, like, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { PluginTrustSchema } from '@ValenceContracts/schemas/Plugin';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import {
  pluginConnection,
  pluginInstallation,
  pluginProfile,
  pluginStorage,
} from '@ValenceServer/db/Schema';
import { likeLiterally } from '@ValenceServer/db/likeLiterally';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { InstalledRecord, PluginStore } from './PluginStore';

const SettingsSchema = z.record(z.string(), z.union([z.string(), z.boolean()]));

/**
 * Installed plugins, what each keeps and who connected to it, held in Postgres. A row whose manifest
 * no longer reads is left out rather than trusted, which is what an older server does with a plugin
 * written for a newer one.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabasePluginStore = (db: ValenceDatabase): PluginStore => {
  const readRow = (row: typeof pluginInstallation.$inferSelect): InstalledRecord[] => {
    const manifest = PluginManifestSchema.safeParse(row.manifest);
    const trust = PluginTrustSchema.safeParse(row.trust);
    const settings = SettingsSchema.safeParse(row.settings);

    if (!manifest.success || !trust.success) {
      return [];
    }

    return [
      {
        id: row.id,
        version: row.version,
        trust: trust.data,
        manifest: manifest.data,
        packageBase64: row.package,
        sha256: row.sha256,
        isEnabled: row.isEnabled,
        settings: settings.success ? settings.data : {},
        installedBy: row.installedBy,
        installedAt: row.installedAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        problem: row.problem,
      },
    ];
  };

  return {
    list: async () =>
      (await db.select().from(pluginInstallation).orderBy(asc(pluginInstallation.id))).flatMap(
        readRow,
      ),
    read: async (id) => {
      const [row] = await db.select().from(pluginInstallation).where(eq(pluginInstallation.id, id));

      return row === undefined ? null : (readRow(row)[0] ?? null);
    },
    save: async (record) => {
      const row = {
        id: record.id,
        version: record.version,
        trust: record.trust,
        manifest: record.manifest,
        package: record.packageBase64,
        sha256: record.sha256,
        isEnabled: record.isEnabled,
        settings: record.settings,
        installedBy: record.installedBy,
        updatedAt: new Date(),
        problem: null,
      };

      await db
        .insert(pluginInstallation)
        .values(row)
        .onConflictDoUpdate({ target: pluginInstallation.id, set: row });
    },
    change: async (id, changes) => {
      const changed = await db
        .update(pluginInstallation)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(pluginInstallation.id, id))
        .returning({ id: pluginInstallation.id });

      return changed.length > 0;
    },
    remove: async (id) =>
      (
        await db
          .delete(pluginInstallation)
          .where(eq(pluginInstallation.id, id))
          .returning({ id: pluginInstallation.id })
      ).length > 0,
    readValue: async (pluginId, key) => {
      const [row] = await db
        .select({ value: pluginStorage.value })
        .from(pluginStorage)
        .where(and(eq(pluginStorage.pluginId, pluginId), eq(pluginStorage.key, key)));
      const read = JsonValueSchema.safeParse(row?.value ?? null);

      return read.success ? read.data : null;
    },
    writeValue: async (pluginId, key, value, bytes) => {
      await db
        .insert(pluginStorage)
        .values({ pluginId, key, value, bytes })
        .onConflictDoUpdate({
          target: [pluginStorage.pluginId, pluginStorage.key],
          set: { value, bytes, updatedAt: new Date() },
        });
    },
    forgetValue: async (pluginId, key) => {
      await db
        .delete(pluginStorage)
        .where(and(eq(pluginStorage.pluginId, pluginId), eq(pluginStorage.key, key)));
    },
    listKeys: async (pluginId, prefix) =>
      (
        await db
          .select({ key: pluginStorage.key })
          .from(pluginStorage)
          .where(
            and(
              eq(pluginStorage.pluginId, pluginId),
              like(pluginStorage.key, `${likeLiterally(prefix)}%`),
            ),
          )
          .orderBy(asc(pluginStorage.key))
      ).map((row) => row.key),
    bytesKept: async (pluginId, except) => {
      const [row] = await db
        .select({ bytes: sql<string>`coalesce(sum(${pluginStorage.bytes}), 0)` })
        .from(pluginStorage)
        .where(
          except === undefined
            ? eq(pluginStorage.pluginId, pluginId)
            : and(eq(pluginStorage.pluginId, pluginId), ne(pluginStorage.key, except)),
        );

      return Number(row?.bytes ?? 0);
    },
    readConnection: async (pluginId, profileId, provider) => {
      const [row] = await db
        .select()
        .from(pluginConnection)
        .where(
          and(
            eq(pluginConnection.pluginId, pluginId),
            eq(pluginConnection.profileId, profileId),
            eq(pluginConnection.provider, provider),
          ),
        );

      return row === undefined
        ? null
        : {
            pluginId: row.pluginId,
            profileId: row.profileId,
            provider: row.provider,
            accessToken: row.accessToken,
            refreshToken: row.refreshToken,
            expiresAt: row.expiresAt?.toISOString() ?? null,
            account: row.account,
          };
    },
    saveConnection: async (connection) => {
      const row = {
        ...connection,
        expiresAt: connection.expiresAt === null ? null : new Date(connection.expiresAt),
      };

      await db
        .insert(pluginConnection)
        .values(row)
        .onConflictDoUpdate({
          target: [
            pluginConnection.pluginId,
            pluginConnection.profileId,
            pluginConnection.provider,
          ],
          set: row,
        });
    },
    forgetConnection: async (pluginId, profileId, provider) =>
      (
        await db
          .delete(pluginConnection)
          .where(
            and(
              eq(pluginConnection.pluginId, pluginId),
              eq(pluginConnection.profileId, profileId),
              eq(pluginConnection.provider, provider),
            ),
          )
          .returning({ pluginId: pluginConnection.pluginId })
      ).length > 0,
    rememberProfile: async (pluginId, profileId) => {
      await db.insert(pluginProfile).values({ pluginId, profileId }).onConflictDoNothing();
    },
    profilesOf: async (pluginId) => {
      const used = await db
        .select({ profileId: pluginProfile.profileId })
        .from(pluginProfile)
        .where(eq(pluginProfile.pluginId, pluginId));
      const connected = await db
        .select({ profileId: pluginConnection.profileId })
        .from(pluginConnection)
        .where(eq(pluginConnection.pluginId, pluginId));

      return [...new Set([...used, ...connected].map((row) => row.profileId))].sort();
    },
  };
};

export { createDatabasePluginStore };
