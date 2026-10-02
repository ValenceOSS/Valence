import { describe, expect, it } from 'vitest';
import { calendarDayArrival } from './calendarDayArrival';

describe('calendarDayArrival', () => {
  it('rises a day into place from a little smaller and lower, after the wait it is given', () => {
    const arrival = calendarDayArrival(0.2, false);

    expect(arrival.initial).toEqual({ opacity: 0, y: 12, scale: 0.96 });
    expect(arrival.animate).toEqual({ opacity: 1, y: 0, scale: 1 });
    expect(arrival.transition).toMatchObject({ delay: 0.2 });
  });

  it('simply shows the day for somebody who asked for less motion', () => {
    const arrival = calendarDayArrival(0.2, true);

    expect(arrival.initial).toBe(false);
    expect(arrival.animate).toEqual({ opacity: 1, y: 0, scale: 1 });
    expect(arrival.transition).toBeUndefined();
  });
});
