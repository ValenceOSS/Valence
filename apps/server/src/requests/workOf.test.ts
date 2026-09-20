import { describe, expect, it } from 'vitest';
import { workOf } from './workOf';
import type { DownloadClientState, QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { MediaRequest, MediaRequestState } from '@ValenceContracts/schemas/MediaRequest';

/**
 * A request in the state given, last touched when it says.
 */
const aRequest = (
  state: MediaRequestState,
  approval: MediaRequest['approval'] = 'approved',
  updatedAt = '2026-09-19T10:00:00.000Z',
): Pick<MediaRequest, 'state' | 'approval' | 'updatedAt'> => ({ state, approval, updatedAt });

/**
 * A download coming down at the speed given.
 */
const aDownload = (
  downloadBytesPerSecond: number | null,
): Pick<QueuedDownload, 'downloadBytesPerSecond'> => ({ downloadBytesPerSecond });

/**
 * A download client, answering or not.
 */
const aClient = (
  name: string,
  isReachable: boolean,
  isEnabled = true,
): Pick<DownloadClientState, 'name' | 'isReachable' | 'isEnabled' | 'problem'> => ({
  name,
  isReachable,
  isEnabled,
  problem: isReachable ? null : 'No answer',
});

describe('workOf', () => {
  it('counts what is waiting, going, stuck and arrived, and how fast it all comes down', () => {
    const work = workOf(
      [
        aRequest('wanted', 'awaiting'),
        aRequest('searching'),
        aRequest('downloading'),
        aRequest('filing'),
        aRequest('failed'),
        aRequest('available', 'approved', '2026-09-19T08:00:00.000Z'),
        aRequest('available', 'approved', '2026-09-18T23:00:00.000Z'),
      ],
      { clients: [aClient('qBittorrent', true)], downloads: [aDownload(500), aDownload(null)] },
      '2026-09-19',
    );

    expect(work).toEqual({
      awaitingApproval: 1,
      searching: 2,
      downloading: 2,
      failed: 1,
      arrivedToday: 1,
      downloadBytesPerSecond: 500,
      clients: { total: 1, reachable: 1, failing: [] },
    });
  });

  it('names the download clients that are not answering, and ignores the ones turned off', () => {
    const work = workOf(
      [],
      {
        clients: [
          aClient('qBittorrent', false),
          aClient('SABnzbd', true),
          aClient('Transmission', false, false),
        ],
        downloads: [],
      },
      '2026-09-19',
    );

    expect(work.clients).toEqual({
      total: 2,
      reachable: 1,
      failing: [{ name: 'qBittorrent', problem: 'No answer' }],
    });
  });

  it('says there is nothing doing where the service could not be asked', () => {
    expect(workOf([], null, '2026-09-19')).toEqual({
      awaitingApproval: 0,
      searching: 0,
      downloading: 0,
      failed: 0,
      arrivedToday: 0,
      downloadBytesPerSecond: 0,
      clients: { total: 0, reachable: 0, failing: [] },
    });
  });
});
