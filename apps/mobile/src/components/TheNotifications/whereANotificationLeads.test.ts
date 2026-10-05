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

  it('opens the album or playlist a notification names, requesting its missing songs where it says', () => {
    expect(whereANotificationLeads('/music?listen=album:a1')).toEqual({
      kind: 'album',
      albumId: 'a1',
    });
    expect(whereANotificationLeads('/music?listen=playlist:p1:request')).toEqual({
      kind: 'playlist',
      playlistId: 'p1',
      isRequestingMissing: true,
    });
    expect(whereANotificationLeads('/music?listen=playlist:p1')).toEqual({
      kind: 'playlist',
      playlistId: 'p1',
    });
    expect(whereANotificationLeads('/music?listen=liked')).toBeNull();
  });

  it('leads nowhere from a link it cannot read', () => {
    expect(whereANotificationLeads('/music?listen=playlist%E0%A4%A')).toBeNull();
    expect(whereANotificationLeads('/?item=%E0%A4%A')).toBeNull();
  });

  it('leads nowhere from a link that is not one of these', () => {
    expect(whereANotificationLeads(null)).toBeNull();
    expect(whereANotificationLeads('/admin')).toBeNull();
  });
});
