import { describe, expect, it } from 'vitest';
import { volumeOf } from './volumeOf';

describe('volumeOf', () => {
  it('reads the series and the volume a title names', () => {
    expect(volumeOf('Chainsaw Man, Vol. 10')).toEqual({ series: 'Chainsaw Man', volume: 10 });
  });

  it('leaves the edition out of the series', () => {
    expect(volumeOf('Vagabond (VIZBIG Edition), Vol. 3')).toEqual({
      series: 'Vagabond',
      volume: 3,
    });
    expect(volumeOf('Vagabond VIZBIG Edition, Vol. 9')).toEqual({ series: 'Vagabond', volume: 9 });
  });

  it('is nothing for a book that names no volume', () => {
    expect(volumeOf('Atomic Habits')).toBeNull();
  });
});
