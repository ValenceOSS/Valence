import { describe, expect, it } from 'vitest';
import { GIVE_UP_DEFAULTS } from '@ValenceContracts/schemas/GiveUpRules';
import { aScratchDatabase } from '#dialect/aScratchDatabase';
import { createDatabaseGiveUpRuleStore } from './createDatabaseGiveUpRuleStore';

describe('createDatabaseGiveUpRuleStore', () => {
  it('reads the defaults until somebody changes them', async () => {
    const store = createDatabaseGiveUpRuleStore(await aScratchDatabase());

    expect(await store.read()).toEqual(GIVE_UP_DEFAULTS);
  });

  it('keeps what was changed, including a rule that never gives up', async () => {
    const store = createDatabaseGiveUpRuleStore(await aScratchDatabase());
    const rules = {
      metadataMinutes: null,
      stalledHours: 24,
      slowDays: 14,
      refusesUnknownFiles: false,
    };

    expect(await store.write(rules)).toEqual(rules);
    expect(await store.read()).toEqual(rules);
  });

  it('writes over the rules rather than keeping a second set', async () => {
    const store = createDatabaseGiveUpRuleStore(await aScratchDatabase());

    await store.write({ ...GIVE_UP_DEFAULTS, stalledHours: 1 });
    await store.write({ ...GIVE_UP_DEFAULTS, stalledHours: 3 });

    expect((await store.read()).stalledHours).toBe(3);
  });
});
