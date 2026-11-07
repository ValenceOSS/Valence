import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { statusOfRequest } from './statusOfRequest';

describe('statusOfRequest', () => {
  it('says how far the download has come while it downloads', () => {
    const status = statusOfRequest(aMediaRequest({ state: 'downloading' }), {
      downloadId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
      state: 'downloading',
      progress: 0.4,
      sizeBytes: 100,
      doneBytes: 40,
      downloadBytesPerSecond: null,
      secondsLeft: null,
    });

    expect(status.tone).toBe('busy');
    expect(status.label).toMatch(/40%$/);
  });

  it('is in the tone of where it stands while nothing is downloading', () => {
    expect(statusOfRequest(aMediaRequest({ state: 'awaitingApproval', items: [] }), null)).toEqual(
      expect.objectContaining({ tone: 'warning' }),
    );
  });
});
