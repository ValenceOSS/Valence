import { giveFocusTo } from '@ValenceTv/navigation/giveFocusTo';

describe('giveFocusTo', () => {
  it('asks the television to send the remote to the view', () => {
    const requestTVFocus = jest.fn();
    giveFocusTo({ requestTVFocus });

    expect(requestTVFocus).toHaveBeenCalledTimes(1);
  });

  it('leaves the remote where it is without a view', () => {
    expect(() => {
      giveFocusTo(null);
    }).not.toThrow();
  });
});
