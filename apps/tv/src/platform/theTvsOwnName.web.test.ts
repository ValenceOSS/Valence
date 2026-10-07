import { theTvsOwnName } from '@ValenceTv/platform/theTvsOwnName';

describe('theTvsOwnName in a browser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('names nothing, rather than the browser Expo guesses from an LG user agent', () => {
    jest
      .spyOn(window.navigator, 'userAgent', 'get')
      .mockReturnValue(
        'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chr0me/94.0.4606.128 Safari/537.36 WebAppManager',
      );

    expect(theTvsOwnName()).toBeNull();
  });
});
