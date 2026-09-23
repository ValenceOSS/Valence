import { ActionSheetIOS } from 'react-native';
import { askWhichVersion } from './askWhichVersion';

const VERSIONS = [
  { id: 'theatrical', label: 'Theatrical' },
  { id: 'directors', label: "Director's cut" },
];

describe('askWhichVersion', () => {
  it('plays the version picked', () => {
    jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_, picked) => {
      picked(1);
    });
    const onChoose = jest.fn();

    askWhichVersion(VERSIONS, onChoose);

    expect(onChoose).toHaveBeenCalledWith('directors');
  });

  it('plays nothing when somebody cancels', () => {
    jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_, picked) => {
      picked(2);
    });
    const onChoose = jest.fn();

    askWhichVersion(VERSIONS, onChoose);

    expect(onChoose).not.toHaveBeenCalled();
  });
});
