import { I18nManager } from 'react-native';
import { layOutFor } from './layOutFor';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('layOutFor', () => {
  it('turns the app right to left for Arabic, from the next launch', () => {
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => undefined);

    jest.replaceProperty(I18nManager, 'isRTL', false);

    expect(layOutFor('ar')).toBe(true);
    expect(forceRTL).toHaveBeenCalledWith(true);
  });

  it('leaves an app already laid out the right way alone', () => {
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => undefined);

    jest.replaceProperty(I18nManager, 'isRTL', false);

    expect(layOutFor('de')).toBe(false);
    expect(forceRTL).not.toHaveBeenCalled();
  });
});
