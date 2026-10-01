import { describe, expect, it } from 'vitest';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { createDatabaseHiddenService } from './createDatabaseHiddenService';

const STARTING_POSTGRES_MS = 60_000;

describe('createDatabaseHiddenService', { timeout: STARTING_POSTGRES_MS }, () => {
  it('hides a thing once however often it is hidden, beside a hidden library', async () => {
    const { db } = await aHousehold();
    const hiding = createDatabaseHiddenService(db);

    await expect(hiding.hide('pat', { kind: 'item', subjectId: 'film' })).resolves.toBe(true);
    await expect(hiding.hide('pat', { kind: 'item', subjectId: 'film' })).resolves.toBe(true);
    await expect(hiding.hide('pat', { kind: 'library', subjectId: 'music' })).resolves.toBe(true);

    const listed = await hiding.list('pat');

    expect(listed.map((one) => one.subjectId).sort()).toEqual(['film', 'music']);
  });

  it('refuses to hide what is not there', async () => {
    const { db } = await aHousehold();

    await expect(
      createDatabaseHiddenService(db).hide('pat', { kind: 'item', subjectId: 'nothing' }),
    ).resolves.toBe(false);
  });

  it('says whether showing something again changed anything', async () => {
    const { db } = await aHousehold();
    const hiding = createDatabaseHiddenService(db);

    await hiding.hide('pat', { kind: 'item', subjectId: 'film' });

    await expect(hiding.show('pat', { kind: 'item', subjectId: 'film' })).resolves.toBe(true);
    await expect(hiding.show('pat', { kind: 'item', subjectId: 'film' })).resolves.toBe(false);
  });
});
