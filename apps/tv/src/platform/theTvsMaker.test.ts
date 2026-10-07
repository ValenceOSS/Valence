import { theTvsMaker } from '@ValenceTv/platform/theTvsMaker';

describe('theTvsMaker', () => {
  it('says nothing on a television app, which knows its own kind', () => {
    expect(theTvsMaker()).toBeNull();
  });
});
