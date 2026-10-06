import { startFocusEngine } from '@ValenceTv/focus/startFocusEngine';

describe('startFocusEngine', () => {
  it('has nothing to start on tvOS or Android TV, which have a focus engine of their own', () => {
    expect(startFocusEngine()).toBeUndefined();
  });
});
