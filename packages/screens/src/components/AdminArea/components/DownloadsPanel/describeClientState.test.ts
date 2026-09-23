import { describe, expect, it } from 'vitest';
import { describeClientState } from './describeClientState';
import type { DownloadClientState } from '@ValenceContracts/schemas/DownloadQueue';

const A_READING: DownloadClientState = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'qBittorrent',
  kind: 'qbittorrent',
  isEnabled: true,
  isReachable: true,
  problem: null,
  problemCode: null,
  downloadBytesPerSecond: 0,
  uploadBytesPerSecond: 0,
  checkedAt: '2026-09-19T00:00:00.000Z',
};

describe('describeClientState', () => {
  it('says a client is off, whatever was last heard', () => {
    expect(describeClientState(false, A_READING).label).toBe('Off');
  });

  it('says a client has not been asked yet', () => {
    expect(describeClientState(true, undefined).label).toBe('Not asked yet');
    expect(describeClientState(true, { ...A_READING, checkedAt: null }).label).toBe(
      'Not asked yet',
    );
  });

  it('says a client answers, or why it could not be reached', () => {
    expect(describeClientState(true, A_READING)).toEqual({
      label: 'Answering',
      tone: 'success',
      detail: null,
    });
    expect(
      describeClientState(true, {
        ...A_READING,
        isReachable: false,
        problem: 'qBittorrent could not be reached',
        problemCode: 'DownloadClientUnreachable',
      }),
    ).toEqual({
      label: 'Unreachable',
      tone: 'danger',
      detail: 'qBittorrent could not be reached',
      help: 'https://docs.getvalence.app/install/requesting#download-clients',
    });
  });
});
