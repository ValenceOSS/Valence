import { ActionSheetIOS } from 'react-native';
import { askWhenToSleep } from '@ValenceMobile/books/askWhenToSleep';

const pick = (at: number) =>
  jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_, picked) => {
    picked(at);
  });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('askWhenToSleep', () => {
  it('offers minutes and the end of the chapter', () => {
    const onChosen = jest.fn();
    const sheet = pick(4);

    askWhenToSleep(false, onChosen);

    expect(sheet.mock.calls[0]?.[0].options).toEqual([
      '15 minutes',
      '30 minutes',
      '45 minutes',
      '60 minutes',
      'End of this chapter',
      'Cancel',
    ]);
    expect(onChosen).toHaveBeenCalledWith('endOfChapter');
  });

  it('offers turning it off first where a timer is set', () => {
    const onChosen = jest.fn();

    pick(0);
    askWhenToSleep(true, onChosen);

    expect(onChosen).toHaveBeenCalledWith('off');
  });

  it('hands back the minutes picked, and nothing where somebody cancelled', () => {
    const onChosen = jest.fn();

    pick(1);
    askWhenToSleep(false, onChosen);
    pick(5);
    askWhenToSleep(false, onChosen);

    expect(onChosen).toHaveBeenCalledTimes(1);
    expect(onChosen).toHaveBeenCalledWith(30);
  });
});
