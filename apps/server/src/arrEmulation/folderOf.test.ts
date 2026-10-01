import { describe, expect, it } from 'vitest';
import { folderOf } from './folderOf';

describe('folderOf', () => {
  it('names the folder after the title and its year', () => {
    expect(folderOf({ title: 'Arrival', year: 2016 })).toBe('Arrival (2016)');
  });

  it('leaves the year out where it is not known', () => {
    expect(folderOf({ title: 'Arrival', year: null })).toBe('Arrival');
  });
});
