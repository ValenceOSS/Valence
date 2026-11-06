import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { carryOverAddedAt } from './carryOverAddedAt';

const STARTING_DATABASE_MS = 60_000;

describe('carryOverAddedAt', { timeout: STARTING_DATABASE_MS }, () => {
  it('gives an upgrade the day the copy it replaces was added, never a later one', async () => {
    const db = await aMigratedDatabase();
    const first = new Date('2024-01-01T00:00:00.000Z');
    const later = new Date('2026-11-01T00:00:00.000Z');

    await db.insert(library).values({ id: 'lib', name: 'Films', kind: 'movies', path: '/f' });
    await db.insert(mediaItem).values([
      { ...aMediaItemRow('old', 'lib'), addedAt: first },
      { ...aMediaItemRow('new', 'lib'), addedAt: later },
      { ...aMediaItemRow('older', 'lib'), addedAt: later },
      { ...aMediaItemRow('newer', 'lib'), addedAt: first },
    ]);

    await carryOverAddedAt(db, [
      { from: 'old', to: 'new' },
      { from: 'older', to: 'newer' },
    ]);

    const rows = await db.select({ id: mediaItem.id, addedAt: mediaItem.addedAt }).from(mediaItem);
    const addedOf = (id: string) => rows.find((row) => row.id === id)?.addedAt.toISOString();

    expect(addedOf('new')).toBe(first.toISOString());
    expect(addedOf('newer')).toBe(first.toISOString());
  });
});
