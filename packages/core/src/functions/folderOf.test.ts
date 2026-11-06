import { describe, expect, it } from 'vitest';
import { folderOf } from './folderOf';

describe('folderOf', () => {
  it('finds the folder a file sits in', () => {
    expect(folderOf('/media/films/Arrival (2016)/Arrival.mkv')).toBe('/media/films/Arrival (2016)');
  });

  it('reads a Windows path as well', () => {
    expect(folderOf('D:\\Films\\Arrival.mkv')).toBe('D:\\Films');
  });
});
