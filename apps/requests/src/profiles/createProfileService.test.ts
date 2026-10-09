import { describe, expect, it } from 'vitest';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { createProfileService } from './createProfileService';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

const AT = new Date('2026-09-19T00:00:00.000Z');

/**
 * A service over no profiles to begin with.
 */
const aService = () =>
  createProfileService({ store: createMemoryRecordStore<QualityProfile>(), now: () => AT });

describe('createProfileService', () => {
  it('adds a profile with what it was not told filled in, and lists them by name', async () => {
    const service = aService();

    const ultra = await service.add({
      name: 'Ultra',
      kind: 'video',
      qualities: ['remux-2160p', 'bluray-2160p', 'webdl-2160p', 'webrip-2160p', 'hdtv-2160p'],
    });

    await service.add({ name: 'Albums', kind: 'music' });

    expect(ultra).toMatchObject({
      name: 'Ultra',
      qualities: ['remux-2160p', 'bluray-2160p', 'webdl-2160p', 'webrip-2160p', 'hdtv-2160p'],
      createdAt: AT.toISOString(),
    });
    expect((await service.list()).map((profile) => profile.name)).toEqual(['Albums', 'Ultra']);
    expect(await service.find(ultra.id)).toEqual(ultra);
  });

  it('changes only what it is told to', async () => {
    const service = aService();
    const hd = await service.add({ name: 'HD', kind: 'video', bannedWords: ['cam'] });

    expect(await service.change(hd.id, { isUpgrading: true })).toMatchObject({
      isUpgrading: true,
      bannedWords: ['cam'],
      qualities: [
        'remux-1080p',
        'bluray-1080p',
        'webdl-1080p',
        'webrip-1080p',
        'hdtv-1080p',
        'bluray-720p',
        'webdl-720p',
        'webrip-720p',
        'hdtv-720p',
      ],
    });
    expect(await service.change('nothing', { name: 'x' })).toBeNull();
  });

  it('leaves at most one default profile of a kind standing, whichever was set last', async () => {
    const service = aService();
    const hd = await service.add({ name: 'HD', kind: 'video', isDefault: true });
    const ultra = await service.add({ name: 'Ultra', kind: 'video', isDefault: true });

    expect((await service.find(hd.id))?.isDefault).toBe(false);
    expect((await service.find(ultra.id))?.isDefault).toBe(true);

    const back = await service.change(hd.id, { isDefault: true });

    expect(back?.isDefault).toBe(true);
    expect((await service.find(ultra.id))?.isDefault).toBe(false);
  });

  it('leaves the default for music standing when one is set for video', async () => {
    const service = aService();
    const albums = await service.add({ name: 'Albums', kind: 'music', isDefault: true });

    await service.add({ name: 'HD', kind: 'video', isDefault: true });

    expect((await service.find(albums.id))?.isDefault).toBe(true);
  });

  it('names nobody by default, which is what puts a profile on offer to the house', async () => {
    const service = aService();
    const hd = await service.add({ name: 'HD', kind: 'video' });

    expect(hd).toMatchObject({ isDefault: false, roleIds: [], accountIds: [] });
    expect(await service.change(hd.id, { roleIds: ['trusted'] })).toMatchObject({
      roleIds: ['trusted'],
    });
  });

  it('removes a profile, and says whether there was one', async () => {
    const service = aService();
    const hd = await service.add({ name: 'HD', kind: 'video' });

    expect(await service.remove(hd.id)).toBe(true);
    expect(await service.remove(hd.id)).toBe(false);
  });
});
