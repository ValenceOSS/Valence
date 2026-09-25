import { whereANotificationLeads } from './whereANotificationLeads';

describe('whereANotificationLeads', () => {
  it('opens the title a notification names', () => {
    expect(whereANotificationLeads('/?item=abc')).toEqual({ kind: 'title', mediaId: 'abc' });
  });

  it('opens the programme a notification names', () => {
    expect(whereANotificationLeads('/?show=severance')).toEqual({
      kind: 'series',
      seriesId: 'severance',
    });
  });

  it('opens the book a notification names', () => {
    expect(whereANotificationLeads('/?book=b%201')).toEqual({ kind: 'book', bookId: 'b 1' });
  });

  it('leads nowhere from a link that is not one of these', () => {
    expect(whereANotificationLeads(null)).toBeNull();
    expect(whereANotificationLeads('/admin')).toBeNull();
  });
});
