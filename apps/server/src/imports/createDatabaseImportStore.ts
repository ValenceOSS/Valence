import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { upsert } from '@ValenceDatabase/upsert';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import {
  MEDIA_IMPORT_KINDS,
  MediaImportKindSchema,
  MediaImportReportSchema,
  MediaImportRunStateSchema,
} from '@ValenceContracts/schemas/MediaImport';
import type { MediaImportKind } from '@ValenceContracts/schemas/MediaImport';
import { importLink, importRun, importSource } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import {
  ImportCursorSchema,
  ImportRunOptionsSchema,
  ImportSourceDetailsSchema,
} from './ImportRecords';
import type {
  ImportRunChange,
  ImportRunOptions,
  ImportSourceDetails,
  StoredImportRun,
  StoredImportSource,
} from './ImportRecords';

type SourceRow = typeof importSource.$inferSelect;

type RunRow = typeof importRun.$inferSelect;

/**
 * Reads a stored source, its details read through their schema.
 *
 * @param row - The row.
 * @returns The source, or null where its kind is not a media server.
 */
const sourceOf = (row: SourceRow): StoredImportSource | null => {
  const kind = MediaImportKindSchema.safeParse(row.kind);

  return kind.success
    ? {
        id: row.id,
        kind: kind.data,
        name: row.name,
        url: row.url,
        token: row.token,
        details: ImportSourceDetailsSchema.catch(ImportSourceDetailsSchema.parse({})).parse(
          row.details,
        ),
        createdAt: row.createdAt,
      }
    : null;
};

/**
 * Reads a stored run, each of its json columns read through its schema.
 *
 * @param row - The row.
 * @returns The run.
 */
const runOf = (row: RunRow): StoredImportRun => ({
  id: row.id,
  sourceId: row.sourceId,
  state: MediaImportRunStateSchema.catch('failed').parse(row.state),
  options: ImportRunOptionsSchema.catch(ImportRunOptionsSchema.parse({})).parse(row.options),
  cursor: ImportCursorSchema.nullable().catch(null).parse(row.cursor),
  report: MediaImportReportSchema.nullable().catch(null).parse(row.report),
  failure: SaidSchema.nullable().catch(null).parse(row.failure),
  jobId: row.jobId,
  createdAt: row.createdAt,
  startedAt: row.startedAt,
  finishedAt: row.finishedAt,
});

/**
 * The media servers an administrator has connected to bring things across from, each import run
 * against them, and the record of which source thing became which Valence thing.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseImportStore = (db: AnyValenceDatabase) => {
  const findSource = async (id: string): Promise<StoredImportSource | null> => {
    const [row] = await db.select().from(importSource).where(eq(importSource.id, id)).limit(1);

    return row === undefined ? null : sourceOf(row);
  };

  const findRun = async (id: string): Promise<StoredImportRun | null> => {
    const [row] = await db.select().from(importRun).where(eq(importRun.id, id)).limit(1);

    return row === undefined ? null : runOf(row);
  };

  return {
    addSource: async (source: {
      kind: MediaImportKind;
      name: string;
      url: string;
      token: string;
      details: ImportSourceDetails;
    }): Promise<StoredImportSource> => {
      const id = randomUUID();
      const now = new Date();

      await db.insert(importSource).values({ id, ...source, createdAt: now, updatedAt: now });

      return { id, ...source, createdAt: now };
    },

    findSource,

    listSources: async (): Promise<StoredImportSource[]> => {
      const rows = await db
        .select()
        .from(importSource)
        .where(inArray(importSource.kind, [...MEDIA_IMPORT_KINDS]))
        .orderBy(desc(importSource.createdAt));

      return rows.flatMap((row) => {
        const source = sourceOf(row);

        return source === null ? [] : [source];
      });
    },

    changeSource: async (
      id: string,
      change: { name?: string; url?: string; token?: string; details?: ImportSourceDetails },
    ): Promise<void> => {
      await db
        .update(importSource)
        .set({ ...change, updatedAt: new Date() })
        .where(eq(importSource.id, id));
    },

    removeSource: async (id: string): Promise<void> => {
      await db.delete(importSource).where(eq(importSource.id, id));
    },

    addRun: async (sourceId: string, options: ImportRunOptions): Promise<StoredImportRun> => {
      const id = randomUUID();

      await db.insert(importRun).values({ id, sourceId, state: 'planning', options });

      const stored = await findRun(id);

      if (stored === null) {
        throw new Error('the import run that was just written could not be read back');
      }

      return stored;
    },

    findRun,

    latestRuns: async (): Promise<StoredImportRun[]> => {
      const rows = await db.select().from(importRun).orderBy(desc(importRun.createdAt));
      const seen = new Set<string>();

      return rows.flatMap((row) => {
        if (seen.has(row.sourceId)) {
          return [];
        }

        seen.add(row.sourceId);

        return [runOf(row)];
      });
    },

    changeRun: async (id: string, change: ImportRunChange): Promise<void> => {
      await db.update(importRun).set(change).where(eq(importRun.id, id));
    },

    links: async (sourceId: string, kind: string): Promise<Map<string, string>> => {
      const rows = await db
        .select({ sourceKey: importLink.sourceKey, valenceId: importLink.valenceId })
        .from(importLink)
        .where(and(eq(importLink.sourceId, sourceId), eq(importLink.kind, kind)));

      return new Map(rows.map((row) => [row.sourceKey, row.valenceId]));
    },

    setLink: async (
      sourceId: string,
      kind: string,
      sourceKey: string,
      valenceId: string,
    ): Promise<void> => {
      const now = new Date();

      await upsert(db, importLink, {
        values: [
          {
            id: randomUUID(),
            sourceId,
            kind,
            sourceKey,
            valenceId,
            createdAt: now,
            updatedAt: now,
          },
        ],
        target: [importLink.sourceId, importLink.kind, importLink.sourceKey],
        set: { valenceId, updatedAt: now },
      });
    },
  };
};

type ImportStore = ReturnType<typeof createDatabaseImportStore>;

export type { ImportStore };

export { createDatabaseImportStore };
