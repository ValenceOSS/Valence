import { partsOfDownload } from '@ValenceTv/requests/partsOfDownload';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';

const PROGRESS: RequestProgress = {
  downloadId: '00000000-0000-4000-8000-000000000001',
  state: 'downloading',
  progress: 0.426,
  sizeBytes: 2_000_000_000,
  doneBytes: 1_000_000_000,
  downloadBytesPerSecond: 5_000_000,
  secondsLeft: 5400,
};

describe('partsOfDownload', () => {
  it('says everything the server knows about the download', () => {
    const parts = partsOfDownload(PROGRESS);

    expect(parts.percent).toBe('43%');
    expect(parts.arrived).toMatch(/ of /u);
    expect(parts.speed).toMatch(/\/s$/u);
    expect(parts.left).toBe('1 h 30 min');
  });

  it('says only the size where nothing is known to have arrived', () => {
    const parts = partsOfDownload({ ...PROGRESS, doneBytes: null });

    expect(parts.arrived).not.toBeNull();
    expect(parts.arrived).not.toMatch(/ of /u);
  });

  it('says nothing of what the server does not know', () => {
    expect(
      partsOfDownload({
        ...PROGRESS,
        sizeBytes: null,
        downloadBytesPerSecond: null,
        secondsLeft: null,
      }),
    ).toEqual({ percent: '43%', arrived: null, speed: null, left: null });
  });

  it('says nothing of the speed while nothing is arriving', () => {
    expect(partsOfDownload({ ...PROGRESS, downloadBytesPerSecond: 0 }).speed).toBeNull();
  });

  it('says under a minute where less than one is left', () => {
    expect(partsOfDownload({ ...PROGRESS, secondsLeft: 20 }).left).toBe('Under a minute');
  });
});
