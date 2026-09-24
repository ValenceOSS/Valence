import { ActionSheetIOS } from 'react-native';
import { askForASpeed } from '@ValencePhone/books/askForASpeed';

const pick = (at: number) =>
  jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_, picked) => {
    picked(at);
  });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('askForASpeed', () => {
  it('offers every speed, marking the one it plays at now', () => {
    const sheet = pick(6);

    askForASpeed(1.5, jest.fn());

    expect(sheet.mock.calls[0]?.[0].options).toEqual([
      '0.75×',
      '1×',
      '1.25×',
      '1.5× ✓',
      '1.75×',
      '2×',
      'Cancel',
    ]);
  });

  it('hands back the speed picked, and nothing where somebody cancelled', () => {
    const onChosen = jest.fn();

    pick(2);
    askForASpeed(1, onChosen);
    pick(6);
    askForASpeed(1, onChosen);

    expect(onChosen).toHaveBeenCalledTimes(1);
    expect(onChosen).toHaveBeenCalledWith(1.25);
  });
});
