import { describe, expect, it } from 'vitest';
import { discFolderOf } from './discFolderOf';

describe('discFolderOf', () => {
  it('reads the folder a disc was copied into from one of its streams', () => {
    expect(discFolderOf('/movies/A Film (2010)/BDMV/STREAM/00800.m2ts')).toBe(
      '/movies/A Film (2010)',
    );
  });

  it('reads the folders whatever their case', () => {
    expect(discFolderOf('/movies/A Film (2010)/bdmv/Stream/00001.m2ts')).toBe(
      '/movies/A Film (2010)',
    );
  });

  it('says nothing of a file that is not inside a disc’s streams', () => {
    expect(discFolderOf('/movies/A Film (2010)/A Film (2010).m2ts')).toBeNull();
    expect(discFolderOf('/movies/A Film (2010)/BDMV/BACKUP/00001.m2ts')).toBeNull();
    expect(discFolderOf('/movies/A Film (2010)/BDMV/STREAM/SSIF/00001.ssif')).toBeNull();
  });
});
