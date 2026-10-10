import { rowsRememberTheirPlace } from '@ValenceTv/focus/rowsRememberTheirPlace';

describe('rowsRememberTheirPlace', () => {
  it('has a television’s rows keep their place, as its own rows do', () => {
    expect(rowsRememberTheirPlace).toBe(true);
  });
});
