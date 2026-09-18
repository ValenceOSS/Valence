import { describe, expect, it } from 'vitest';
import type { DiskUse } from '@ValenceServer/maintenance/DiskUse';
import { freeBytesOn } from './freeBytesOn';

const disks: DiskUse[] = [
  { mountPoint: '/', totalBytes: 500_000_000_000, availableBytes: 100_000_000_000 },
  { mountPoint: '/mnt/tank', totalBytes: 8_000_000_000_000, availableBytes: 2_000_000_000_000 },
  {
    mountPoint: '/mnt/tank/media',
    totalBytes: 4_000_000_000_000,
    availableBytes: 900_000_000_000,
  },
];

describe('freeBytesOn', () => {
  it('takes the longest mount the path begins with, which is the one it is really on', () => {
    expect(freeBytesOn(disks, '/mnt/tank/media/Films/X.mkv')).toBe(900_000_000_000);
  });

  it('takes the pool for something outside the library nested under it', () => {
    expect(freeBytesOn(disks, '/mnt/tank/backups/X.mkv')).toBe(2_000_000_000_000);
  });

  it('falls back to the root for a path nothing else claims', () => {
    expect(freeBytesOn(disks, '/var/lib/valence')).toBe(100_000_000_000);
  });

  it('does not mistake a neighbour whose name merely starts the same way', () => {
    const alongside: DiskUse[] = [
      { mountPoint: '/mnt/tankard', totalBytes: 1, availableBytes: 42 },
    ];

    expect(freeBytesOn(alongside, '/mnt/tank/media/X.mkv')).toBeNull();
  });

  it('answers for a mount point named exactly', () => {
    expect(freeBytesOn(disks, '/mnt/tank/media')).toBe(900_000_000_000);
  });

  it('claims nothing where the media service reported no mounts at all', () => {
    expect(freeBytesOn([], '/mnt/tank/media/X.mkv')).toBeNull();
  });
});
