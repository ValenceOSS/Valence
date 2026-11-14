import { describe, expect, it } from 'vitest';
import { createRateAverage } from './createRateAverage';

describe('createRateAverage', () => {
  it('averages every rate heard since it was last taken from', () => {
    const average = createRateAverage();

    average.add(100);
    average.add(300);

    expect(average.take()).toBe(200);

    average.add(50);

    expect(average.take()).toBe(50);
  });

  it('says nothing, never zero, where no rate was heard', () => {
    const average = createRateAverage();

    average.add(null);

    expect(average.take()).toBeNull();
  });

  it('leaves out the readings that had no rate', () => {
    const average = createRateAverage();

    average.add(400);
    average.add(null);

    expect(average.take()).toBe(400);
  });
});
