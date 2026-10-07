import { followTheController } from '@ValenceTv/remote/followTheController';

describe('followTheController', () => {
  it('leaves a television app’s controller to the system', () => {
    expect(followTheController()).toBeUndefined();
  });
});
