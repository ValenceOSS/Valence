import { describe, expect, it } from 'vitest';
import { ArrQueuePageSchema } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';
import { problemOfQueueRecord } from './problemOfQueueRecord';

/**
 * One queue record read as an app would answer, with what the test is about laid over it.
 *
 * @param fields - What to change.
 * @returns The record.
 */
const aRecord = (fields: Record<string, string | null | { messages: string[] }[]>) => {
  const [record] = ArrQueuePageSchema.parse({
    records: [{ id: 1, title: 'Dune.Part.Two.2024.2160p', status: 'downloading', ...fields }],
  }).records;

  if (record === undefined) {
    throw new Error('No record');
  }

  return record;
};

describe('problemOfQueueRecord', () => {
  it('says nothing of a download that is going well', () => {
    expect(problemOfQueueRecord(aRecord({ trackedDownloadStatus: 'ok' }))).toBeNull();
  });

  it('passes on what the app says is wrong, each line once', () => {
    expect(
      problemOfQueueRecord(
        aRecord({
          status: 'completed',
          trackedDownloadStatus: 'warning',
          statusMessages: [{ messages: ['No files found are eligible for import'] }],
          errorMessage: 'No files found are eligible for import',
        }),
      ),
    ).toEqual({
      code: null,
      message: 'No files found are eligible for import',
      values: {},
    });
  });

  it('names the status where the app gives no words of its own', () => {
    expect(problemOfQueueRecord(aRecord({ status: 'failed' }))?.message).toBe('failed');
  });
});
