import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { meterOfRequest } from './meterOfRequest';

describe('meterOfRequest', () => {
  it('fills to how far the download has come while it downloads', () => {
    const meter = meterOfRequest(aMediaRequest({ state: 'downloading' }), {
      downloadId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
      state: 'downloading',
      progress: 0.4,
      sizeBytes: 100,
      doneBytes: 40,
      downloadBytesPerSecond: null,
      secondsLeft: null,
    });

    expect(meter.fraction).toBe(0.4);
    expect(meter.tone).toBe('busy');
    expect(meter.label).toMatch(/40%$/);
  });

  it('fills to how much is here where some of it is', () => {
    const meter = meterOfRequest(
      aMediaRequest({
        state: 'wanted',
        items: [
          aRequestItem({ id: 'a', state: 'available' }),
          aRequestItem({ id: 'b', state: 'wanted' }),
        ],
      }),
      null,
    );

    expect(meter.fraction).toBe(0.5);
  });

  it('is full in its colour where nothing has come yet', () => {
    expect(meterOfRequest(aMediaRequest({ state: 'awaitingApproval', items: [] }), null)).toEqual(
      expect.objectContaining({ fraction: 1, tone: 'highlight' }),
    );
  });
});
