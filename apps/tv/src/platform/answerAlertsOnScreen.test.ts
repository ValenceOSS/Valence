import { answerAlertsOnScreen } from '@ValenceTv/platform/answerAlertsOnScreen';

describe('answerAlertsOnScreen', () => {
  it('leaves alerts to the television', () => {
    expect(answerAlertsOnScreen()).toBeUndefined();
  });
});
