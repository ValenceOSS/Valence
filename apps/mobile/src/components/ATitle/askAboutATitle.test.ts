import { ActionSheetIOS } from 'react-native';
import { askAboutATitle } from './askAboutATitle';

describe('askAboutATitle', () => {
  it('offers each action under the title, and does the one picked', () => {
    const sheet = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_options, picked) => {
        picked(1);
      });
    const watched = jest.fn();
    const hidden = jest.fn();

    askAboutATitle('Corpse Bride', [
      { label: 'Mark Corpse Bride as watched', onChoose: watched },
      { label: 'Hide', onChoose: hidden },
    ]);

    expect(sheet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Corpse Bride',
        options: ['Mark Corpse Bride as watched', 'Hide', 'Cancel'],
        cancelButtonIndex: 2,
      }),
      expect.any(Function),
    );
    expect(hidden).toHaveBeenCalled();
    expect(watched).not.toHaveBeenCalled();
  });

  it('does nothing when the sheet is cancelled', () => {
    jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_options, picked) => {
        picked(1);
      });
    const hidden = jest.fn();

    askAboutATitle('Corpse Bride', [{ label: 'Hide', onChoose: hidden }]);

    expect(hidden).not.toHaveBeenCalled();
  });
});
