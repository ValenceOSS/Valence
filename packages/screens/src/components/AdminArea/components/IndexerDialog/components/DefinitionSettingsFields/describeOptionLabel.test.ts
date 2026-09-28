import { describe, expect, it } from 'vitest';
import { describeOptionLabel } from './describeOptionLabel';

describe('describeOptionLabel', () => {
  it('names a sort direction in words', () => {
    expect(describeOptionLabel('desc')).toBe('Descending');
    expect(describeOptionLabel('asc')).toBe('Ascending');
  });

  it('starts any other choice with a capital', () => {
    expect(describeOptionLabel('created')).toBe('Created');
    expect(describeOptionLabel('Seeders')).toBe('Seeders');
  });
});
