import { describe, expect, it } from 'vitest';
import { announcementQueries } from './announcementQueries';

describe('announcementQueries', () => {
  it('keeps the announcement under a key of its own, so the socket can refresh it', () => {
    expect(announcementQueries.current().queryKey).toEqual(['announcement', 'current']);
    expect(announcementQueries.key).toEqual(['announcement']);
  });

  it('reads it again every minute, so one that ends on its own goes on time', () => {
    expect(announcementQueries.current().refetchInterval).toBe(60_000);
  });
});
