import { describe, expect, it } from 'vitest';
import { ArrBlocklistPageSchema } from './ArrBlocklistPageSchema';

describe('ArrBlocklistPageSchema', () => {
  it('reads a page of an app’s blocklist, with nothing where it lists nothing', () => {
    expect(
      ArrBlocklistPageSchema.parse({
        page: 1,
        records: [{ id: 4, sourceTitle: 'A.Film.2021.720p', date: '2026-10-01T10:00:00Z' }],
      }).records,
    ).toMatchObject([{ id: 4, sourceTitle: 'A.Film.2021.720p' }]);
    expect(ArrBlocklistPageSchema.parse({}).records).toEqual([]);
  });
});
