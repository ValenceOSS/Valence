import { describe, expect, it } from 'vitest';
import { SECTIONS } from '@ValenceClient/navigation/readLocation';
import { TOUR_STOPS } from './tourStops';

describe('TOUR_STOPS', () => {
  it('starts at home', () => {
    expect(TOUR_STOPS[0]?.section).toBe('home');
  });

  it('visits each place once, and only places that exist', () => {
    const sections = TOUR_STOPS.map((stop) => stop.section);

    expect(new Set(sections).size).toBe(sections.length);

    for (const section of sections) {
      expect(SECTIONS).toContain(section);
    }
  });

  it('says what every place is for', () => {
    for (const stop of TOUR_STOPS) {
      expect(stop.title).not.toBe('');
      expect(stop.detail.length).toBeGreaterThan(20);
    }
  });
});
