import { thePhonesReach } from './thePhonesReach';

describe('thePhonesReach', () => {
  it('starts optimistic, since refusing to try is worse than trying and failing', () => {
    expect(thePhonesReach().isReachable()).toBe(true);
  });

  it('lets go of the listener it took', () => {
    expect(() => thePhonesReach().whenChanged(() => undefined)()).not.toThrow();
  });
});
