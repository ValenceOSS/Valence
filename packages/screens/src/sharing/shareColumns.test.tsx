import { describe, expect, it, vi } from 'vitest';
import { shareColumns } from './shareColumns';

describe('shareColumns', () => {
  it('says what a link opens, whether it works, how often it was opened, and how to withdraw it', () => {
    expect(shareColumns(vi.fn()).map((column) => column.id)).toEqual([
      'title',
      'standing',
      'opened',
      'act',
    ]);
  });

  it('sets the caller’s own columns straight after the link itself', () => {
    const columns = shareColumns(vi.fn(), [{ id: 'createdBy', header: 'By' }]);

    expect(columns.map((column) => column.id)).toEqual([
      'title',
      'createdBy',
      'standing',
      'opened',
      'act',
    ]);
  });
});
