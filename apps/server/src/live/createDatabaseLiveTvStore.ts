import { randomUUID } from 'node:crypto';
import { and, asc, eq, gt, inArray, lt } from 'drizzle-orm';
import { countAffected } from '@ValenceDatabase/countAffected';
import { insertUnlessPresent } from '@ValenceDatabase/insertUnlessPresent';
import { upsert } from '@ValenceDatabase/upsert';
import { setEverythingFrom } from '@ValenceServer/linking/catalogue/setEverythingFrom';
import { liveChannel, liveFavourite, liveProgramme, liveSource } from '#dialect/Schema';
import { LiveHealthSchema, LiveSourceKindSchema } from '@ValenceContracts/schemas/LiveTv';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { LiveTvStore, StoredLiveChannel, StoredLiveSource } from './LiveTvStore';

const AT_ONCE = 500;

/**
 * A source as the rest of the server reads it, or nothing where its kind has been tampered with.
 *
 * @param row - The row as stored.
 * @returns The source, as a list of one or none.
 */
const sourceOf = (row: typeof liveSource.$inferSelect): StoredLiveSource[] => {
  const kind = LiveSourceKindSchema.safeParse(row.kind);

  return kind.success
    ? [
        {
          id: row.id,
          name: row.name,
          kind: kind.data,
          address: row.address,
          guideUrl: row.guideUrl,
          logoUrl: row.logoUrl,
          playlist: row.playlist,
          channelCount: row.channelCount,
          refreshedAt: row.refreshedAt,
          problem: row.problem ?? null,
          createdAt: row.createdAt,
        },
      ]
    : [];
};

/**
 * A channel as the rest of the server reads it.
 *
 * @param row - The row as stored.
 * @returns The channel.
 */
const channelOf = (row: typeof liveChannel.$inferSelect): StoredLiveChannel => ({
  id: row.id,
  sourceId: row.sourceId,
  position: row.position,
  number: row.number,
  name: row.name,
  group: row.groupName,
  logoUrl: row.logoUrl,
  guideId: row.guideId,
  streamUrl: row.streamUrl,
  userAgent: row.userAgent,
  referrer: row.referrer,
  health: LiveHealthSchema.safeParse(row.health).data ?? null,
  route: row.route === 'proxy' ? 'proxy' : row.route === 'direct' ? 'direct' : null,
  checkedAt: row.checkedAt,
});

/**
 * Writes rows a few hundred at a time, so a playlist of thousands of channels or a guide of tens of
 * thousands of programmes is never one statement too long for the database.
 *
 * @param rows - The rows.
 * @param write - How to write one batch.
 */
const inBatches = async <Row>(rows: readonly Row[], write: (batch: Row[]) => Promise<void>) => {
  for (let at = 0; at < rows.length; at += AT_ONCE) {
    await write(rows.slice(at, at + AT_ONCE));
  }
};

/**
 * The live TV sources an admin added, the channels each gives, what is on them, and the channels
 * each profile keeps as favourites, kept in the database. A source's channels and programmes are
 * replaced whole each time it is read again; a channel keeps its id across reads, so a favourite
 * survives as long as the channel does.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseLiveTvStore = (db: AnyValenceDatabase): LiveTvStore => ({
  listSources: async () =>
    (await db.select().from(liveSource).orderBy(asc(liveSource.createdAt))).flatMap(sourceOf),

  readSource: async (id) =>
    (await db.select().from(liveSource).where(eq(liveSource.id, id))).flatMap(sourceOf)[0] ?? null,

  addSource: async (source) => {
    await db.insert(liveSource).values(source);
  },

  changeSource: async (id, change) => {
    await db.update(liveSource).set(change).where(eq(liveSource.id, id));
  },

  removeSource: async (id) =>
    countAffected(await db.delete(liveSource).where(eq(liveSource.id, id))) > 0,

  replaceChannels: async (sourceId, channels) => {
    const kept = new Set(channels.map((channel) => channel.id));
    const held = await db
      .select({ id: liveChannel.id })
      .from(liveChannel)
      .where(eq(liveChannel.sourceId, sourceId));
    const gone = held.map((row) => row.id).filter((id) => !kept.has(id));

    await inBatches(gone, async (batch) => {
      await db.delete(liveChannel).where(inArray(liveChannel.id, batch));
    });

    await inBatches(channels, async (batch) => {
      await upsert(db, liveChannel, {
        values: batch.map((channel) => ({
          id: channel.id,
          sourceId,
          position: channel.position,
          number: channel.number,
          name: channel.name,
          groupName: channel.group,
          logoUrl: channel.logoUrl,
          guideId: channel.guideId,
          streamUrl: channel.streamUrl,
          userAgent: channel.userAgent,
          referrer: channel.referrer,
        })),
        target: liveChannel.id,
        set: setEverythingFrom(liveChannel, ['id', 'health', 'route', 'checkedAt']),
      });
    });
  },

  replaceProgrammes: async (sourceId, programmes) => {
    await db.delete(liveProgramme).where(eq(liveProgramme.sourceId, sourceId));
    await inBatches(programmes, async (batch) => {
      await db
        .insert(liveProgramme)
        .values(batch.map((programme) => ({ id: randomUUID(), sourceId, ...programme })));
    });
  },

  listChannels: async () =>
    (await db.select().from(liveChannel).orderBy(asc(liveChannel.position))).map(channelOf),

  noteHealth: async (channelId, health, route, at) => {
    await db
      .update(liveChannel)
      .set({ health, route, checkedAt: at })
      .where(eq(liveChannel.id, channelId));
  },

  readChannel: async (id) => {
    const [row] = await db.select().from(liveChannel).where(eq(liveChannel.id, id));

    return row === undefined ? null : channelOf(row);
  },

  listProgrammes: async (from, until) =>
    (
      await db
        .select()
        .from(liveProgramme)
        .where(and(gt(liveProgramme.endsAt, from), lt(liveProgramme.startsAt, until)))
        .orderBy(asc(liveProgramme.startsAt))
    ).map((row) => ({
      sourceId: row.sourceId,
      guideId: row.guideId,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      category: row.category,
    })),

  favouritesOf: async (profileId) =>
    new Set(
      (
        await db
          .select({ channelId: liveFavourite.channelId })
          .from(liveFavourite)
          .where(eq(liveFavourite.profileId, profileId))
      ).map((row) => row.channelId),
    ),

  keep: async (profileId, channelId) => {
    await insertUnlessPresent(db, liveFavourite, {
      values: [{ profileId, channelId, keptAt: new Date() }],
      target: [liveFavourite.profileId, liveFavourite.channelId],
    });
  },

  drop: async (profileId, channelId) => {
    await db
      .delete(liveFavourite)
      .where(and(eq(liveFavourite.profileId, profileId), eq(liveFavourite.channelId, channelId)));
  },
});

export { createDatabaseLiveTvStore };
