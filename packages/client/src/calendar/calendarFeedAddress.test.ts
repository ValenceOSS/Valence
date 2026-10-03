import { describe, expect, it } from 'vitest';
import { calendarFeedAddress } from './calendarFeedAddress';

describe('calendarFeedAddress', () => {
  it('writes the feed’s address on this server', () => {
    expect(calendarFeedAddress('abc_-123', 'https://valence.example/')).toBe(
      'https://valence.example/api/calendar/feed/abc_-123.ics',
    );
  });

  it('writes it for a calendar app to open as a subscription', () => {
    expect(calendarFeedAddress('abc', 'http://192.168.1.36:3000', true)).toBe(
      'webcal://192.168.1.36:3000/api/calendar/feed/abc.ics',
    );
  });
});
