import { describe, expect, it } from 'vitest';
import { wholeDriveOf } from './wholeDriveOf';

const disk = (mountPoint: string, device: string, totalBytes: number, availableBytes: number) => ({
  mountPoint,
  device,
  totalBytes,
  availableBytes,
});

const ROOT = disk('/', 'overlay', 500, 400);
const MEDIA = disk('/media', 'tank/media', 700, 400);
const CACHE = disk('/cache', 'tank/apps', 450, 400);
const CONFIG = disk('/config', 'tank/apps', 450, 400);

describe('wholeDriveOf', () => {
  it('returns a disk that is not part of a pool as it is', () => {
    const plain = disk('/media', '/dev/sda1', 1000, 200);

    expect(wholeDriveOf([ROOT, plain], plain)).toBe(plain);
  });

  it('puts a pool back together from its datasets, each counted once', () => {
    expect(wholeDriveOf([ROOT, MEDIA, CACHE, CONFIG], MEDIA)).toEqual({
      mountPoint: '/media',
      device: 'tank/media',
      totalBytes: 750,
      availableBytes: 400,
    });
  });

  it('takes the pool’s room left over a dataset held to less by a quota', () => {
    const capped = disk('/cache', 'tank/apps', 100, 50);

    expect(wholeDriveOf([MEDIA, capped], MEDIA)).toMatchObject({
      totalBytes: 750,
      availableBytes: 400,
    });
  });

  it('leaves out another pool', () => {
    expect(wholeDriveOf([MEDIA, disk('/backup', 'vault/backup', 900, 100)], MEDIA)).toMatchObject({
      totalBytes: 700,
    });
  });
});
