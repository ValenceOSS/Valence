import { theKindOfTv } from '@ValenceTv/platform/theKindOfTv';

describe('theKindOfTv in a browser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('names another maker’s television after its maker, where the browser says who that is', () => {
    jest
      .spyOn(window.navigator, 'userAgent', 'get')
      .mockReturnValue(
        'Chrome/122.0 OMI/4.24, TV_2025_4K /0.1 (Philips, 55PUS8500, wired) SmartTvA/5 TitanOS/3.0',
      );

    expect(theKindOfTv('smartTv')).toBe('Philips TV');
  });

  it('calls it a smart TV where the browser does not say', () => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (SmartTV)');

    expect(theKindOfTv('smartTv')).toBe('Smart TV');
  });
});
