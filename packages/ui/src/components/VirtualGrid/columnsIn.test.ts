import { describe, expect, it } from 'vitest';
import { columnsIn } from './columnsIn';

describe('columnsIn', () => {
  it('fits as many whole cards across as the room allows', () => {
    expect(columnsIn(1200, 220, 16)).toBe(5);
    expect(columnsIn(1200, 420, 16)).toBe(2);
    expect(columnsIn(600, 170, 16)).toBe(3);
  });

  it('draws one card across where there is no room for two, or no room at all', () => {
    expect(columnsIn(200, 420, 16)).toBe(1);
    expect(columnsIn(0, 170, 16)).toBe(1);
  });
});
