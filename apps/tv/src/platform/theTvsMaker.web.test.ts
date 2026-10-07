import { theTvsMaker } from '@ValenceTv/platform/theTvsMaker';

describe('theTvsMaker in a browser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads the maker the browser names', () => {
    jest
      .spyOn(window.navigator, 'userAgent', 'get')
      .mockReturnValue('Chrome/111.0 Odin/111 VIDAA/9.0(Hisense;SmartTV;65A60LXVT;MTK9603;)');

    expect(theTvsMaker()).toBe('Hisense');
  });
});
