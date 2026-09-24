import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testAndSayWhy } from './testAndSayWhy';
import type * as Indexers from '@ValenceClient/requests/fetchIndexers';

const testIndexer = vi.fn<typeof Indexers.testIndexer>();

vi.mock('@ValenceClient/requests/fetchIndexers', () => ({
  testIndexer: (...given: Parameters<typeof Indexers.testIndexer>) => testIndexer(...given),
}));

const JACKETT = { id: '0f8fad5b-d9cb-469f-a165-70867728950e', name: 'Jackett' };

beforeEach(() => {
  testIndexer.mockReset();
});

describe('testAndSayWhy', () => {
  it('says nothing where the indexer answered', async () => {
    testIndexer.mockResolvedValue({
      value: {
        isWorking: true,
        problem: null,
        problemCode: null,
        capabilities: null,
        captcha: null,
      },
      refusal: null,
    });

    expect(await testAndSayWhy(JACKETT)).toBeNull();
    expect(testIndexer).toHaveBeenCalledWith(JACKETT.id);
  });

  it('says why it failed, naming it', async () => {
    testIndexer.mockResolvedValue({
      value: {
        isWorking: false,
        problem: 'Timed out',
        problemCode: null,
        capabilities: null,
        captcha: null,
      },
      refusal: null,
    });

    expect(await testAndSayWhy(JACKETT)).toBe('Jackett: Timed out');
  });

  it('says so where the answer could not be read', async () => {
    testIndexer.mockRejectedValue(new Error('Unexpected token'));

    expect(await testAndSayWhy(JACKETT)).toBe('Jackett: its answer could not be read');
  });
});
