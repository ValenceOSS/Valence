import { ActionSheetIOS } from 'react-native';
import { chooseADownloadQuality } from './chooseADownloadQuality';

const OFFER = {
  mediaId: 'arrival',
  title: 'Arrival',
  episodes: 1,
  options: [
    {
      quality: 'original' as const,
      label: 'Original',
      meaning: 'As it is on the server',
      bytes: 4_000_000_000,
      comparison: null,
      wouldTranscode: false,
    },
    {
      quality: '720p' as const,
      label: '720p',
      meaning: 'Smaller',
      bytes: null,
      comparison: null,
      wouldTranscode: true,
    },
  ],
};

describe('chooseADownloadQuality', () => {
  it('offers each quality with its size, and hands back the one picked', async () => {
    const asking = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_, picked) => {
        picked(1);
      });

    await expect(chooseADownloadQuality(OFFER, 'Download Arrival')).resolves.toBe('720p');
    expect(asking.mock.calls[0]?.[0].options).toEqual([
      expect.stringMatching(/^Original · \d/u),
      '720p',
      'Cancel',
    ]);
  });

  it('hands back nothing when somebody cancels', async () => {
    jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_, picked) => {
      picked(2);
    });

    await expect(chooseADownloadQuality(OFFER, 'Download Arrival')).resolves.toBeNull();
  });
});
