import { describe, expect, it } from 'vitest';
import { folderOfSeriesKey } from './folderOfSeriesKey';

describe('folderOfSeriesKey', () => {
  it('reads the folder a programme is kept under', () => {
    expect(folderOfSeriesKey('folder:/shows/A Show (2016)')).toBe('/shows/A Show (2016)');
  });

  it('reads none for a programme filed by its catalogue entry or its title', () => {
    expect(folderOfSeriesKey('catalogue:100')).toBeNull();
    expect(folderOfSeriesKey('title:a show')).toBeNull();
  });
});
