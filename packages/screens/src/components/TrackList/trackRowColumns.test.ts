import { describe, expect, it } from 'vitest';
import { trackRowColumns } from './trackRowColumns';

describe('trackRowColumns', () => {
  it('gives the album a column of its own on wide screens only where it is shown', () => {
    expect(trackRowColumns(true)).toContain('md:grid-cols-');
    expect(trackRowColumns(false)).not.toContain('md:');
  });
});
