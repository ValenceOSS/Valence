import { describe, expect, it } from 'vitest';
import {
  placesInSeries,
  seriesNameOf,
  titleFromFolderName,
} from '@ValenceRequests/mediaRequests/seriesOfPack';

describe('seriesNameOf', () => {
  it('leaves out the author, the numbering and the packaging', () => {
    expect(seriesNameOf(['Pierce Brown-Red Rising-[1-5]'], ['Pierce Brown'])).toBe('Red Rising');
    expect(seriesNameOf(['Red Rising Saga Books 1-5 - Pierce Brown'], ['Pierce Brown'])).toBe(
      'Red Rising',
    );
    expect(seriesNameOf(['The Expanse (Books 1-9) Unabridged M4B'], [])).toBe('The Expanse');
  });

  it('tries the next name where one says no more than the author', () => {
    expect(seriesNameOf(['Pierce Brown', 'Red Rising Collection'], ['Pierce Brown'])).toBe(
      'Red Rising',
    );
    expect(seriesNameOf(['Pierce Brown [1-5]'], ['Pierce Brown'])).toBeNull();
  });
});

describe('placesInSeries', () => {
  it('takes the places the books’ names give', () => {
    expect(
      placesInSeries([
        { names: ['Pierce Brown-Red Rising-#3-Morning Star'], year: 2016 },
        { names: ['Pierce Brown-Red Rising-5-Dark Age'], year: 2019 },
        { names: ['Something', 'Book 1-Red Rising.m4b'], year: 2014 },
      ]),
    ).toEqual([3, 5, 1]);
  });

  it('goes by the years where a name gives no place, then by the packing', () => {
    expect(
      placesInSeries([
        { names: ['Golden Son'], year: 2015 },
        { names: ['Red Rising'], year: 2014 },
        { names: ['Iron Gold'], year: null },
        { names: ['#4 Morning Star'], year: 2016 },
      ]),
    ).toEqual([2, 1, 4, 3]);
  });

  it('goes by the years where two names give the same place', () => {
    expect(
      placesInSeries([
        { names: ['#1 One'], year: 2020 },
        { names: ['#1 Two'], year: 2010 },
      ]),
    ).toEqual([2, 1]);
  });
});

describe('titleFromFolderName', () => {
  it('takes the last part of the name that is not a number', () => {
    expect(titleFromFolderName('Pierce Brown-Red Rising-#2-Golden Son')).toBe('Golden Son');
    expect(titleFromFolderName('Pierce Brown - Red Rising - 5')).toBe('Red Rising');
    expect(titleFromFolderName('Dune')).toBe('Dune');
  });
});
