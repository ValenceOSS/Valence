import { describe, expect, it } from 'vitest';
import { opensOutside } from './opensOutside';

describe('opensOutside', () => {
  it('hands web pages and calendar subscriptions to the system', () => {
    expect(opensOutside('https://calendar.google.com/calendar/render?cid=x')).toBe(true);
    expect(opensOutside('http://192.168.1.36:3000/share/abc')).toBe(true);
    expect(opensOutside('webcal://valence.example/api/calendar/feed/abc.ics')).toBe(true);
  });

  it('opens nothing else', () => {
    expect(opensOutside('file:///etc/passwd')).toBe(false);
    expect(opensOutside('javascript:alert(1)')).toBe(false);
    expect(opensOutside('smb://server/share')).toBe(false);
  });
});
