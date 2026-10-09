import { describe, expect, it } from 'vitest';
import { describeDownloadLine } from './describeDownloadLine';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';

const aProgress = (overrides: Partial<RequestProgress>): RequestProgress => ({
  downloadId: '00000000-0000-4000-8000-000000000001',
  state: 'downloading',
  progress: 0.3,
  sizeBytes: null,
  doneBytes: null,
  downloadBytesPerSecond: null,
  secondsLeft: null,
  ...overrides,
});

describe('describeDownloadLine', () => {
  it('says how much has come, how fast and how long is left', () => {
    expect(
      describeDownloadLine(
        aProgress({
          sizeBytes: 120_000_000,
          doneBytes: 40_000_000,
          downloadBytesPerSecond: 2_100_000,
          secondsLeft: 180,
        }),
      ),
    ).toMatch(/^\S+ \S+ of \S+ \S+ · \S+ \S+\/s · 3 min left$/);
  });

  it('says first that a download has stalled', () => {
    expect(describeDownloadLine(aProgress({ state: 'stalled', sizeBytes: 120_000_000 }))).toMatch(
      /^Stalled · \S+ \S+$/,
    );
  });

  it('says only the size where how much has come is not known', () => {
    expect(describeDownloadLine(aProgress({ sizeBytes: 120_000_000 }))).not.toContain(' of ');
  });

  it('says under a minute rather than nought', () => {
    expect(describeDownloadLine(aProgress({ secondsLeft: 20 }))).toBe('Under a minute left');
  });

  it('leaves out a size and a speed of nothing', () => {
    expect(describeDownloadLine(aProgress({ sizeBytes: 0, downloadBytesPerSecond: 0 }))).toBeNull();
  });

  it('says nothing where nothing is known', () => {
    expect(describeDownloadLine(aProgress({}))).toBeNull();
  });
});
