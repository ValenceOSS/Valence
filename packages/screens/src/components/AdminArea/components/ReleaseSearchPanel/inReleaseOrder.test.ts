import { describe, expect, it } from 'vitest';
import { inReleaseOrder } from './inReleaseOrder';
import type { Release } from '@ValenceContracts/schemas/Indexer';

/**
 * A release, with anything the test cares about changed.
 */
const aRelease = (title: string, overrides: Partial<Release> = {}): Release => ({
  id: title,
  title,
  indexerId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  indexerName: 'Jackett',
  protocol: 'torrent',
  sizeBytes: null,
  seeders: null,
  leechers: null,
  grabs: null,
  publishedAt: null,
  categories: [],
  downloadUrl: null,
  magnetUrl: null,
  infoUrl: null,
  infoHash: null,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
  ...overrides,
});

describe('inReleaseOrder', () => {
  it('puts the most widely shared first', () => {
    expect(
      inReleaseOrder([
        aRelease('few', { seeders: 2 }),
        aRelease('many', { seeders: 40 }),
        aRelease('unknown'),
      ]).map((release) => release.title),
    ).toEqual(['many', 'few', 'unknown']);
  });

  it('puts the newest first among those shared equally', () => {
    expect(
      inReleaseOrder([
        aRelease('old', { seeders: 5, publishedAt: '2025-01-01T00:00:00.000Z' }),
        aRelease('new', { seeders: 5, publishedAt: '2026-09-01T00:00:00.000Z' }),
        aRelease('undated', { seeders: 5 }),
      ]).map((release) => release.title),
    ).toEqual(['new', 'old', 'undated']);
  });

  it('orders usenet releases by how often they were fetched', () => {
    expect(
      inReleaseOrder([
        aRelease('rare', { protocol: 'usenet', grabs: 3 }),
        aRelease('popular', { protocol: 'usenet', grabs: 900 }),
      ]).map((release) => release.title),
    ).toEqual(['popular', 'rare']);
  });

  it('leaves what it was given alone', () => {
    const given = [aRelease('a', { seeders: 1 }), aRelease('b', { seeders: 2 })];

    inReleaseOrder(given);

    expect(given.map((release) => release.title)).toEqual(['a', 'b']);
  });
});
