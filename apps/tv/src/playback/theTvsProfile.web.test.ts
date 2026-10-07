import { theTvsProfile } from '@ValenceTv/playback/theTvsProfile';

describe('theTvsProfile in a browser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('names the television whose browser it is', () => {
    jest
      .spyOn(window.navigator, 'userAgent', 'get')
      .mockReturnValue('Mozilla/5.0 (Web0S; Linux/SmartTV) Chrome/87.0.4280.88');

    expect(theTvsProfile().name).toBe('LG TV');
  });

  it('asks the browser what it plays rather than claiming what an Apple TV does', () => {
    expect(theTvsProfile().directPlayProfiles.map((one) => one.container)).not.toContain('mov');
  });
});
