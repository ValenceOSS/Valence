import { describe, expect, it } from 'vitest';
import { stageOfRequestLog } from './stageOfRequestLog';
import type { RequestLogEntry } from '@ValenceContracts/schemas/MediaRequest';

/**
 * A line of a request's activity said with the code given.
 */
const aLine = (code: string | null): RequestLogEntry => ({
  id: 1,
  at: '2026-10-09T17:12:28.000Z',
  message: { code, message: code ?? 'Note', values: {} },
  problemCode: null,
});

const REQUESTS = 'requests.mediaRequests';

const WORKER = `${REQUESTS}.requestWorker`;

const HAND_OFF = 'requests.arrApps.handOff';

describe('stageOfRequestLog', () => {
  it('puts a release wanted with its coming out', () => {
    expect(stageOfRequestLog(aLine(`${WORKER}.itIsOutAndWanted`))).toBe('release');
  });

  it('puts searches, and an indexer that could not answer, with finding a release', () => {
    expect(stageOfRequestLog(aLine(`${REQUESTS}.searched`))).toBe('search');
    expect(stageOfRequestLog(aLine(`${REQUESTS}.indexerCouldNotAnswer`))).toBe('search');
  });

  it('puts a hand-off and a failed download with downloading', () => {
    expect(stageOfRequestLog(aLine(`${HAND_OFF}.handedToName`))).toBe('download');
    expect(stageOfRequestLog(aLine(`${WORKER}.stoppedTitleAndLookingForAnother`))).toBe('download');
  });

  it('puts filing, and failing to file, with importing', () => {
    expect(stageOfRequestLog(aLine(`${WORKER}.filedSizeFromTitleIntoFolder`))).toBe('import');
    expect(stageOfRequestLog(aLine(`${REQUESTS}.couldNotBeFiled`))).toBe('import');
  });

  it('has no stage for a line that could come at any', () => {
    expect(stageOfRequestLog(aLine(`${WORKER}.stoppedByAnAdmin`))).toBeNull();
    expect(stageOfRequestLog(aLine(null))).toBeNull();
  });
});
