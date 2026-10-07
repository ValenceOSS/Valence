import { giveFocusTo } from '@ValenceTv/navigation/giveFocusTo';

describe('giveFocusTo in a browser', () => {
  it('focuses the element the view is drawn as', () => {
    const button = document.createElement('button');
    const view = Object.assign(button, { requestTVFocus: jest.fn() });

    document.body.append(button);
    giveFocusTo(view);

    expect(document.activeElement).toBe(button);
  });

  it('leaves the remote where it is without a view', () => {
    expect(() => {
      giveFocusTo(undefined);
    }).not.toThrow();
  });
});
