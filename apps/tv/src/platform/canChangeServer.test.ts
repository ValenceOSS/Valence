import { canChangeServer } from '@ValenceTv/platform/canChangeServer';

describe('canChangeServer', () => {
  it('offers a different server to a television app', () => {
    expect(canChangeServer()).toBe(true);
  });
});
