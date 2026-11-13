import { describe, expect, it } from 'vitest';
import { linkStateOf } from '@ValenceServer/origins/linkStateOf';

/**
 * Reads a file as having some links, the way `stat` does.
 *
 * @param nlink - How many names the file's data has.
 * @param isFile - Whether it is a file, not a folder.
 * @returns What reads it.
 */
const aFileWith =
  (nlink: number, isFile = true) =>
  () =>
    Promise.resolve({ nlink, isFile: () => isFile });

describe('linkStateOf', () => {
  it('says a file sharing its data with another name is linked', async () => {
    expect(await linkStateOf('/films/Heat.mkv', aFileWith(2))).toBe('linked');
  });

  it('says a file with one name stands alone', async () => {
    expect(await linkStateOf('/films/Heat.mkv', aFileWith(1))).toBe('alone');
  });

  it('says nothing of a folder, or of a file it could not read', async () => {
    expect(await linkStateOf('/films', aFileWith(3, false))).toBeNull();
    expect(await linkStateOf('/gone.mkv', () => Promise.reject(new Error('ENOENT')))).toBeNull();
  });
});
