import { requireOptionalNativeModule } from 'expo';
import { ActionSheetIOS, Platform } from 'react-native';
import { showActionSheet } from './showActionSheet';

jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn(() => null) }));

const SHEET = {
  title: 'Which version',
  options: ['Theatrical', 'Extended', 'Cancel'],
  cancelButtonIndex: 2,
};

afterEach(() => {
  Platform.OS = 'ios';
});

describe('showActionSheet', () => {
  it('asks in the system’s action sheet on an iPhone', () => {
    const shown = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_, picked) => {
        picked(1);
      });
    const onPicked = jest.fn();

    showActionSheet(SHEET, onPicked);

    expect(shown).toHaveBeenCalledWith(SHEET, onPicked);
    expect(onPicked).toHaveBeenCalledWith(1);
  });

  it('asks in the system’s list dialog on Android, and says what was picked', async () => {
    Platform.OS = 'android';
    const ask = jest.fn(() => Promise.resolve(0));
    jest.mocked(requireOptionalNativeModule).mockReturnValue({ ask });
    const onPicked = jest.fn();

    showActionSheet(SHEET, onPicked);
    await Promise.resolve();
    await Promise.resolve();

    expect(ask).toHaveBeenCalledWith('Which version', null, SHEET.options, 2, null, []);
    expect(onPicked).toHaveBeenCalledWith(0);
  });

  it('says the cancel choice where the dialog was dismissed', async () => {
    Platform.OS = 'android';
    jest.mocked(requireOptionalNativeModule).mockReturnValue({ ask: () => Promise.resolve(null) });
    const onPicked = jest.fn();

    showActionSheet(SHEET, onPicked);
    await Promise.resolve();
    await Promise.resolve();

    expect(onPicked).toHaveBeenCalledWith(2);
  });
});
