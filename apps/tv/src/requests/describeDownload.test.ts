import { describeDownload } from '@ValenceTv/requests/describeDownload';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';

const PROGRESS: RequestProgress = {
  downloadId: '00000000-0000-4000-8000-000000000001',
  state: 'downloading',
  progress: 0.5,
  sizeBytes: null,
  doneBytes: null,
  downloadBytesPerSecond: null,
  secondsLeft: 600,
};

describe('describeDownload', () => {
  it('says how far through it is and how long is left', () => {
    expect(describeDownload(PROGRESS)).toBe('50% · 10 min left');
  });

  it('says only how far through it is where nothing else is known', () => {
    expect(describeDownload({ ...PROGRESS, secondsLeft: null })).toBe('50%');
  });

  it('says every part it knows, in order', () => {
    const line = describeDownload({
      ...PROGRESS,
      sizeBytes: 1_000_000,
      doneBytes: 500_000,
      downloadBytesPerSecond: 1000,
    });

    expect(line.split(' · ')).toHaveLength(4);
    expect(line.startsWith('50% · ')).toBe(true);
    expect(line.endsWith(' · 10 min left')).toBe(true);
  });
});
