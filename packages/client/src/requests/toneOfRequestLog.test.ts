import { describe, expect, it } from 'vitest';
import { toneOfRequestLog } from './toneOfRequestLog';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { RequestLogEntry } from '@ValenceContracts/schemas/MediaRequest';

/**
 * A said line of the code given, holding the parts given.
 */
const said = (code: string, values: Said['values'] = {}): Said => ({
  code,
  message: code,
  values,
});

/**
 * A line of a request's activity saying what is given.
 */
const aLine = (
  message: Said,
  problemCode: RequestLogEntry['problemCode'] = null,
): RequestLogEntry => ({
  id: 1,
  at: '2026-10-09T17:12:28.000Z',
  message,
  problemCode,
});

const WORKER = 'requests.mediaRequests.requestWorker';

describe('toneOfRequestLog', () => {
  it('is green for something imported', () => {
    expect(toneOfRequestLog(aLine(said(`${WORKER}.filedSizeFromTitleIntoFolder`)))).toBe('success');
  });

  it('is red for a failure, and for anything with a problem to fix', () => {
    expect(toneOfRequestLog(aLine(said(`${WORKER}.stoppedTitleAndLookingForAnother`)))).toBe(
      'danger',
    );
    expect(
      toneOfRequestLog(aLine(said('requests.somethingElse'), 'DownloadClientUnreachable')),
    ).toBe('danger');
  });

  it('is blue for a release wanted', () => {
    expect(toneOfRequestLog(aLine(said(`${WORKER}.itIsOutAndWanted`)))).toBe('accent');
  });

  it('is orange for a search that chose a release, however deep the choice is said', () => {
    const outcome = said('requests.mediaRequests.foundByIndexers', {
      found: 186,
      fetched: said(`${WORKER}.choseTitleTheBestOfForIt`, { forIt: 186 }),
    });

    expect(toneOfRequestLog(aLine(said('requests.mediaRequests.searched', { outcome })))).toBe(
      'busy',
    );
  });

  it('is yellow for a search that found nothing it would take', () => {
    const outcome = said(`${WORKER}.nothingAcceptableHasBeenFoundYet`);

    expect(toneOfRequestLog(aLine(said('requests.mediaRequests.searched', { outcome })))).toBe(
      'highlight',
    );
  });

  it('is grey for anything else', () => {
    expect(toneOfRequestLog(aLine(said(`${WORKER}.stoppedByAnAdmin`)))).toBe('quiet');
    expect(toneOfRequestLog(aLine({ code: null, message: 'Note', values: {} }))).toBe('quiet');
  });
});
