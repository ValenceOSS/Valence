import { describe, expect, it } from 'vitest';
import { HOME_ROW_SIZE } from './HOME_ROW_SIZE';

describe('HOME_ROW_SIZE', () => {
  it('lets a row hold more than the fewest it must have to be drawn', () => {
    expect(HOME_ROW_SIZE.most).toBeGreaterThan(HOME_ROW_SIZE.fewest);
  });
});
