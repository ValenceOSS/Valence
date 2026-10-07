import { whichTv } from '@ValenceTv/native/whichTv';

const LG =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36 WebAppManager';

/**
 * Has the browser say it is something else.
 *
 * @param userAgent - What it says it is.
 */
const sayingItIs = (userAgent: string): void => {
  jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent);
};

describe('whichTv in a browser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is LG’s television where the browser says it runs webOS', () => {
    sayingItIs(LG);

    expect(whichTv()).toBe('lgTv');
  });

  it('is another maker’s television where the browser does not say whose', () => {
    sayingItIs('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko)');

    expect(whichTv()).toBe('smartTv');
  });
});
