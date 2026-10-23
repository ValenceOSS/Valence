import { describe, expect, it } from 'vitest';
import { readEachLibrary } from '@ValenceClient/query/readEachLibrary';

describe('readEachLibrary', () => {
  it('puts together what each library holds', async () => {
    const read = (id: string) => Promise.resolve([`${id}-1`, `${id}-2`]);

    await expect(readEachLibrary(['films', 'shows'], read)).resolves.toEqual([
      'films-1',
      'films-2',
      'shows-1',
      'shows-2',
    ]);
  });

  it('leaves out a library that cannot be read while others answer', async () => {
    const read = (id: string) =>
      id === 'films' ? Promise.reject(new Error('refused')) : Promise.resolve([id]);

    await expect(readEachLibrary(['films', 'shows'], read)).resolves.toEqual(['shows']);
  });

  it('fails where no library could be read, rather than showing an empty page', async () => {
    const read = () => Promise.reject(new Error('signed out'));

    await expect(readEachLibrary(['films', 'shows'], read)).rejects.toThrow('signed out');
  });

  it('answers nothing for no libraries at all', async () => {
    await expect(readEachLibrary([], () => Promise.resolve(['never']))).resolves.toEqual([]);
  });
});
