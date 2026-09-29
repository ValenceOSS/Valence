import { and, asc, eq, like, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { PluginTrustSchema } from '@ValenceContracts/schemas/Plugin';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import {
  pluginConnection,
  pluginInstallation,
  pluginPrevious,
  pluginProfile,
  pluginStorage,
} from '@ValenceServer/db/Schema';
import { likeLiterally } from '@ValenceServer/db/likeLiterally';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { InstalledRecord, PluginStore } from './PluginStore';

const SettingsSchema = z.record(z.string(), z.union([z.string(), z.boolean()]));

const KeptStorageSchema = z.array(
  z.object({ key: z.string(), value: JsonValueSchema, bytes: z.number().int().nonnegative() }),
);

/**
 * Installed plugins, what each keeps and who connected to it, held in Postgres. A row whose manifest
 * no longer reads is left out rather than trusted, which is what an older server does with a plugin
 * written for a newer one.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabasePluginStore = (db: ValenceDatabase): PluginStore => {
  const readRow = (
    row: typeof pluginInstallation.$inferSelect,
    previousVersion: string | null,
  ): InstalledRecord[] => {
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
        previousVersion,
      },
    ];
  };

  const previousVersions = async (): Promise<Map<string, string>> =>
    new Map(
      (
        await db
          .select({ pluginId: pluginPrevious.pluginId, version: pluginPrevious.version })
          .from(pluginPrevious)
      ).map((row) => [row.pluginId, row.version]),
    );

  return {
    list: async () => {
      const earlier = await previousVersions();

      return (
        await db.select().from(pluginInstallation).orderBy(asc(pluginInstallation.id))
      ).flatMap((row) => readRow(row, earlier.get(row.id) ?? null));
    },
    read: async (id) => {
      const [row] = await db.select().from(pluginInstallation).where(eq(pluginInstallation.id, id));
      const [earlier] = await db
        .select({ version: pluginPrevious.version })
        .from(pluginPrevious)
        .where(eq(pluginPrevious.pluginId, id));

      return row === undefined ? null : (readRow(row, earlier?.version ?? null)[0] ?? null);
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
    keepPrevious: async (id) =>
      db.transaction(async (tx) => {
        const [row] = await tx
          .select()
          .from(pluginInstallation)
          .where(eq(pluginInstallation.id, id));

        if (row === undefined) {
          return false;
        }

        const storage = await tx
          .select({
            key: pluginStorage.key,
            value: pluginStorage.value,
            bytes: pluginStorage.bytes,
          })
          .from(pluginStorage)
          .where(eq(pluginStorage.pluginId, id));
        const kept = {
          version: row.version,
          trust: row.trust,
          manifest: row.manifest,
          package: row.package,
          sha256: row.sha256,
          storage,
          keptAt: new Date(),
        };

        await tx
          .insert(pluginPrevious)
          .values({ pluginId: id, ...kept })
          .onConflictDoUpdate({ target: pluginPrevious.pluginId, set: kept });

        return true;
      }),
    restorePrevious: async (id) =>
      db.transaction(async (tx) => {
        const [earlier] = await tx
          .select()
          .from(pluginPrevious)
          .where(eq(pluginPrevious.pluginId, id));
        const storage = KeptStorageSchema.safeParse(earlier?.storage);

        if (earlier === undefined || !storage.success) {
          return false;
        }

        const restored = await tx
          .update(pluginInstallation)
          .set({
            version: earlier.version,
            trust: earlier.trust,
            manifest: earlier.manifest,
            package: earlier.package,
            sha256: earlier.sha256,
            problem: null,
            updatedAt: new Date(),
          })
          .where(eq(pluginInstallation.id, id))
          .returning({ id: pluginInstallation.id });

        if (restored.length === 0) {
          return false;
        }

        await tx.delete(pluginStorage).where(eq(pluginStorage.pluginId, id));

        if (storage.data.length > 0) {
          await tx
            .insert(pluginStorage)
            .values(storage.data.map((kept) => ({ pluginId: id, ...kept })));
        }

        await tx.delete(pluginPrevious).where(eq(pluginPrevious.pluginId, id));

        return true;
      }),
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
