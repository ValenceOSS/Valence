import { upsert } from '@ValenceDatabase/upsert';
import { GIVE_UP_DEFAULTS } from '@ValenceContracts/schemas/GiveUpRules';
import { giveUpRules } from '#dialect/Schema';
import type { GiveUpRules } from '@ValenceContracts/schemas/GiveUpRules';
import type { RequestsDatabase } from '#dialect/RequestsDatabase';

type GiveUpRuleStore = {
  read: () => Promise<GiveUpRules>;
  write: (rules: GiveUpRules) => Promise<GiveUpRules>;
};

const THE_ROW = 1;

/**
 * When Valence gives up on a download and tries the next best release: one row, read as the
 * defaults until somebody has changed them. A wait left empty means that rule never gives up.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseGiveUpRuleStore = (db: RequestsDatabase): GiveUpRuleStore => ({
  read: async () => {
    const [row] = await db.select().from(giveUpRules);

    return row === undefined
      ? GIVE_UP_DEFAULTS
      : {
          metadataMinutes: row.metadataMinutes,
          stalledHours: row.stalledHours,
          slowDays: row.slowDays,
          refusesUnknownFiles: row.refusesUnknownFiles,
        };
  },

  write: async (rules) => {
    await upsert(db, giveUpRules, {
      values: [{ id: THE_ROW, ...rules }],
      target: giveUpRules.id,
      set: { ...rules, updatedAt: new Date() },
    });

    return rules;
  },
});

export type { GiveUpRuleStore };

export { createDatabaseGiveUpRuleStore };
