import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';
import { user } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aSourceToImport, aSourceUser } from './aSourceToImport';
import { bringPersonAcross } from './bringPersonAcross';
import { someImportServices } from './someImportServices';
import type { ImportServices } from './ImportServices';

const CONTEXT = { isYou: false, by: 'account', sourceName: 'Den' };

/**
 * A source to bring people from.
 *
 * @param services - What the import works with.
 * @returns The source's id.
 */
const aSource = async (services: ImportServices): Promise<string> =>
  (
    await services.store.addSource({
      kind: 'plex',
      name: 'Shed',
      url: 'http://shed',
      token: 't',
      details: { serverId: 's', version: '1', clientId: 'c', userTokens: {}, pathMappings: [] },
    })
  ).id;

describe('bringPersonAcross', { timeout: 60_000 }, () => {
  it('makes an account with the person’s picture, administration and address', async () => {
    const { db } = await aHousehold();
    const { services, asked } = someImportServices(db);
    const sourceId = await aSource(services);
    const lee = aSourceUser({
      id: '1111',
      name: 'Lee',
      username: 'lee',
      email: 'Lee@Example.test',
      isAdministrator: true,
      avatarUrl: '/face',
    });
    const brought = await bringPersonAcross(
      services,
      aSourceToImport(),
      sourceId,
      lee,
      CONTEXT,
      'job',
    );

    expect(brought?.outcome).toBe('created');

    const [made] = await db
      .select()
      .from(user)
      .where(eq(user.id, brought?.userId ?? ''));

    expect(made).toMatchObject({ name: 'Lee', username: 'lee', email: 'lee@example.test' });
    expect(asked.administrators).toEqual([brought?.userId]);
    expect(asked.photos).toEqual([brought?.userId]);
  });

  it('uses the administrator’s own account for them', async () => {
    const { db } = await aHousehold();
    const { services } = someImportServices(db);
    const sourceId = await aSource(services);

    expect(
      await bringPersonAcross(
        services,
        aSourceToImport(),
        sourceId,
        aSourceUser({ id: '1', name: 'Pat' }),
        { ...CONTEXT, isYou: true },
        'job',
      ),
    ).toEqual({ userId: 'account', outcome: 'you' });
  });

  it('links somebody already here by their address, and somebody an earlier import made', async () => {
    const { db } = await aHousehold();
    const { services } = someImportServices(db);
    const sourceId = await aSource(services);
    const pat = aSourceUser({ id: '7', name: 'Patricia', email: 'pat@example.test' });

    expect(
      await bringPersonAcross(services, aSourceToImport(), sourceId, pat, CONTEXT, 'job'),
    ).toEqual({
      userId: 'account',
      outcome: 'linked',
    });
    expect(
      await bringPersonAcross(
        services,
        aSourceToImport(),
        sourceId,
        { ...pat, email: null },
        CONTEXT,
        'job',
      ),
    ).toEqual({
      userId: 'account',
      outcome: 'linked',
    });
  });

  it('numbers a username already taken, and goes without an address already taken', async () => {
    const { db } = await aHousehold();
    const createAccountWithoutPassword = vi
      .fn<NonNullable<ImportServices['createAccountWithoutPassword']>>()
      .mockResolvedValueOnce({ kind: 'taken', field: 'username' })
      .mockResolvedValueOnce({ kind: 'taken', field: 'email' })
      .mockResolvedValueOnce({ kind: 'created', userId: 'account' });
    const { services } = someImportServices(db, aSourceToImport(), {
      createAccountWithoutPassword,
    });
    const sourceId = await aSource(services);
    const fran = aSourceUser({
      id: '4444',
      name: 'Fran',
      username: 'fran',
      email: 'fran@example.test',
    });

    expect(
      (await bringPersonAcross(services, aSourceToImport(), sourceId, fran, CONTEXT, 'job'))
        ?.outcome,
    ).toBe('created');
    expect(
      createAccountWithoutPassword.mock.calls.map(([request]) => [request.username, request.email]),
    ).toEqual([
      ['fran', 'fran@example.test'],
      ['fran1', 'fran@example.test'],
      ['fran1', undefined],
    ]);
  });

  it('records why when no account can be made', async () => {
    const { db } = await aHousehold();
    const failing = someImportServices(db, aSourceToImport(), {
      createAccountWithoutPassword: () => Promise.resolve({ kind: 'failed' }),
    });
    const off = someImportServices(db, aSourceToImport(), { createAccountWithoutPassword: null });
    const sourceId = await aSource(failing.services);
    const nobody = aSourceUser({ id: '9', name: 'Nobody' });

    expect(
      await bringPersonAcross(
        failing.services,
        aSourceToImport(),
        sourceId,
        nobody,
        CONTEXT,
        'job',
      ),
    ).toBeNull();
    expect(
      await bringPersonAcross(off.services, aSourceToImport(), sourceId, nobody, CONTEXT, 'job'),
    ).toBeNull();
    expect(failing.asked.issues[0]?.reason.code).toBe(
      'server.imports.bringPersonAcross.theirAccountCouldNotBeMade',
    );
    expect(off.asked.issues[0]?.reason.code).toBe(
      'server.imports.bringPersonAcross.accountsCannotBeMadeHere',
    );
  });

  it('records a picture Valence would not keep', async () => {
    const { db } = await aHousehold();
    const { services, asked } = someImportServices(db, aSourceToImport(), {
      profiles: {
        ...someImportServices(db).services.profiles,
        savePhoto: () => Promise.resolve('notAPicture'),
      },
    });
    const sourceId = await aSource(services);

    await bringPersonAcross(
      services,
      aSourceToImport(),
      sourceId,
      aSourceUser({ id: '5', name: 'Face', avatarUrl: '/face' }),
      CONTEXT,
      'job',
    );

    expect(asked.issues[0]?.reason.code).toBe(
      'server.imports.bringPersonAcross.theirPictureCouldNotBeKept',
    );
  });
});
