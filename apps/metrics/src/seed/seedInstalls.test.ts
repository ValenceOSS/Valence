import { describe, expect, it } from 'vitest';
import { dailyInstalls, installs } from '@ValenceMetrics/db/Schema';
import { aMigratedDatabase } from '@ValenceMetrics/testing/aMigratedDatabase';
import { seedInstalls } from './seedInstalls';
import { seededRandom } from './seededRandom';

const NOW = new Date('2026-10-29T12:00:00Z');

describe('seedInstalls', () => {
  it('makes up installs and their daily reports, the same each time for one seed', async () => {
    const db = await aMigratedDatabase();

    const days = await seedInstalls(db, NOW, 12, seededRandom(412));

    expect(await db.select().from(installs)).toHaveLength(12);
    expect(await db.select().from(dailyInstalls)).toHaveLength(days);

    await seedInstalls(db, NOW, 12, seededRandom(412));

    expect(await db.select().from(installs)).toHaveLength(12);
    expect(await db.select().from(dailyInstalls)).toHaveLength(days);
  });
});
