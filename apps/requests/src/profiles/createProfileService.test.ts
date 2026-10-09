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
  it('adds a profile with what it was not told filled in, and lists them in the order added', async () => {
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
    expect((await service.list()).map((profile) => profile.name)).toEqual(['Ultra', 'Albums']);
    expect(await service.find(ultra.id)).toEqual(ultra);
  });

  it('puts the profiles in the order given, keeping any it was not told of after them', async () => {
    const service = aService();
    const hd = await service.add({ name: 'HD', kind: 'video' });
    const uhd = await service.add({ name: 'UHD', kind: 'video' });
    const flac = await service.add({ name: 'FLAC', kind: 'music' });

    const ordered = await service.reorder([uhd.id, hd.id]);

    expect(ordered.map((profile) => [profile.name, profile.position])).toEqual([
      ['UHD', 0],
      ['HD', 1],
      ['FLAC', 2],
    ]);
    expect((await service.list()).map((profile) => profile.id)).toEqual([uhd.id, hd.id, flac.id]);
  });

  it('puts a new profile at the bottom, and closes the gap one leaves', async () => {
    const service = aService();
    const first = await service.add({ name: 'First', kind: 'video' });
    const second = await service.add({ name: 'Second', kind: 'video' });
    const third = await service.add({ name: 'Third', kind: 'video' });

    expect(third.position).toBe(2);

    await service.remove(second.id);

    expect((await service.list()).map((profile) => [profile.id, profile.position])).toEqual([
      [first.id, 0],
      [third.id, 1],
    ]);
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
