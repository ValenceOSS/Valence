import { ActionSheetIOS } from 'react-native';
import { askHowMuchToDownload } from './askHowMuchToDownload';

const WAYS = [
  { kind: 'these' as const, label: 'The next 3 episodes', mediaIds: ['a', 'b', 'c'] },
  { kind: 'choose' as const, label: 'Choose episodes' },
];

describe('askHowMuchToDownload', () => {
  it('hands back the way picked', async () => {
    jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_, picked) => {
      picked(0);
    });

    await expect(askHowMuchToDownload('Severance', WAYS)).resolves.toEqual(WAYS[0]);
  });

  it('hands back nothing when somebody cancels', async () => {
    jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_, picked) => {
      picked(2);
    });

    await expect(askHowMuchToDownload('Severance', WAYS)).resolves.toBeNull();
  });
});
