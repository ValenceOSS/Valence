import { describe, expect, it } from 'vitest';
import { describeLinkLife } from './describeLinkLife';

const NOW = Date.UTC(2026, 9, 2);

describe('describeLinkLife', () => {
  it('counts whole days left', () => {
    expect(describeLinkLife('2026-10-08T12:00:00.000Z', NOW)).toBe('Link works for 6 more days');
  });

  it('counts hours on the last day', () => {
    expect(describeLinkLife('2026-10-02T05:30:00.000Z', NOW)).toBe('Link works for 5 more hours');
  });

  it('says one hour rather than none in the last hour', () => {
    expect(describeLinkLife('2026-10-02T00:10:00.000Z', NOW)).toBe('Link works for 1 more hour');
  });

  it('says a link has run out', () => {
    expect(describeLinkLife('2026-10-01T00:00:00.000Z', NOW)).toBe('Link has run out');
  });
});
