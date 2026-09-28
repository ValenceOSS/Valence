import { describe, expect, it } from 'vitest';
import { readOptions } from './readOptions';

describe('readOptions', () => {
  it('separates named options from positional words', () => {
    expect(readOptions(['site', '--out', 'dist', 'more', '--verbose'])).toEqual({
      options: { out: 'dist', verbose: 'true' },
      positional: ['site', 'more'],
    });
  });

  it('treats an option followed by another option as a flag', () => {
    expect(readOptions(['--dry', '--out', 'x']).options).toEqual({ dry: 'true', out: 'x' });
  });
});
