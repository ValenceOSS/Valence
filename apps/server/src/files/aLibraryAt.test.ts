import { describe, expect, it } from 'vitest';
import { aLibraryAt } from './aLibraryAt';

describe('aLibraryAt', () => {
  it('makes a library whose folder is where it was told', () => {
    expect(aLibraryAt('/media/films', 'one')).toMatchObject({ id: 'one', path: '/media/films' });
  });
});
