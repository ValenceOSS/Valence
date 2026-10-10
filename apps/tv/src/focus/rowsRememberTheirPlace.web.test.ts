import { rowsRememberTheirPlace } from '@ValenceTv/focus/rowsRememberTheirPlace';

describe('rowsRememberTheirPlace in a browser', () => {
  it('moves between rows by where the cards are instead', () => {
    expect(rowsRememberTheirPlace).toBe(false);
  });
});
