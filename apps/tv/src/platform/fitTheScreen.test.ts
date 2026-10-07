import { fitTheScreen } from '@ValenceTv/platform/fitTheScreen';

describe('fitTheScreen', () => {
  it('leaves a television app’s screen as it is', () => {
    expect(fitTheScreen()).toBeUndefined();
  });
});
