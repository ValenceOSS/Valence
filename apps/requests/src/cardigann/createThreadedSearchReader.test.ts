import { describe, expect, it } from 'vitest';
import { createCategoryMap } from './createCategoryMap';
import { createThreadedSearchReader } from './createThreadedSearchReader';
import { pageForTest } from './pageForTest';
import { readSearchResults } from './readSearchResults';

describe('createThreadedSearchReader', () => {
  it('reads a page on a thread into the same releases as reading it here', async () => {
    const asked = pageForTest();
    const read = createThreadedSearchReader(1);

    expect(await read(asked)).toEqual(
      readSearchResults({ ...asked, categories: createCategoryMap(asked.definition.caps) }),
    );
  });

  it('answers nothing for a page the thread cannot read, so it is read here instead', async () => {
    const asked = pageForTest();
    const read = createThreadedSearchReader(1);

    expect(
      await read({
        ...asked,
        request: { ...asked.request, path: { ...asked.request.path, response: { type: 'json' } } },
      }),
    ).toBeNull();
  });

  it('stops a thread stuck on a page and answers that page with no results', async () => {
    const asked = pageForTest({ stuck: true });
    const read = createThreadedSearchReader(1, 1_000);
    const started = Date.now();

    expect(await read(asked)).toEqual([]);
    expect(Date.now() - started).toBeLessThan(10_000);
    expect(await read(pageForTest())).not.toBeNull();
  }, 30_000);

  it('answers only the stuck page with no results, and sends the others to be read here', async () => {
    const stuck = pageForTest({ stuck: true });
    const read = createThreadedSearchReader(1, 1_000);
    const answers = await Promise.all([read(stuck), read(pageForTest())]);

    expect(answers).toEqual([[], null]);
  }, 30_000);
});
