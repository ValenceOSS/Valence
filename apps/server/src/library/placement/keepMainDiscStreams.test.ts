import { describe, expect, it } from 'vitest';
import { keepMainDiscStreams } from './keepMainDiscStreams';

const DISC = '/movies/A Film (2010)/BDMV/STREAM';

describe('keepMainDiscStreams', () => {
  it('keeps only the largest stream of a disc', () => {
    const files = [
      { path: `${DISC}/00001.m2ts`, sizeBytes: 40 },
      { path: `${DISC}/00800.m2ts`, sizeBytes: 30_000 },
      { path: `${DISC}/00801.m2ts`, sizeBytes: 900 },
    ];

    expect(keepMainDiscStreams(files).map((file) => file.path)).toEqual([`${DISC}/00800.m2ts`]);
  });

  it('keeps one for each disc, and every file that is not on one', () => {
    const files = [
      { path: `${DISC}/00001.m2ts`, sizeBytes: 40 },
      { path: '/movies/Another (2011)/BDMV/STREAM/00002.m2ts', sizeBytes: 10 },
      { path: '/movies/Third (2012)/Third (2012).mkv', sizeBytes: 5 },
      { path: '/movies/Third (2012)/Third (2012) - 1080p.mkv', sizeBytes: 50 },
    ];

    expect(keepMainDiscStreams(files)).toEqual(files);
  });

  it('settles a tie between two the same size by name, so a rescan keeps the same one', () => {
    const files = [
      { path: `${DISC}/00900.m2ts`, sizeBytes: 50 },
      { path: `${DISC}/00800.m2ts`, sizeBytes: 50 },
    ];

    expect(keepMainDiscStreams(files).map((file) => file.path)).toEqual([`${DISC}/00800.m2ts`]);
  });
});
