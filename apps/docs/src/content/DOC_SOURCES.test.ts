import { describe, expect, it } from 'vitest';
import { DOC_SOURCES } from './DOC_SOURCES';

describe('DOC_SOURCES', () => {
  it('reads each page’s own words, for search', async () => {
    const read = DOC_SOURCES['./start/set-up-with-an-ai.mdx'];

    expect(read).toBeDefined();
    expect(await read?.()).toMatch(/assistant/iu);
  });

  it('reads every page it holds without failing', async () => {
    const reads = Object.values(DOC_SOURCES);

    expect(reads.length).toBeGreaterThan(0);
    await expect(Promise.all(reads.map((read) => read()))).resolves.toBeDefined();
  });
});
