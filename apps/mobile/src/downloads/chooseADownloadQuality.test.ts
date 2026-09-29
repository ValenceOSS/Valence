import { ActionSheetIOS } from 'react-native';
import { chooseADownloadQuality } from './chooseADownloadQuality';

const ORIGINAL = {
  quality: 'original' as const,
  label: 'Original',
  meaning: 'As it is on the server',
  bytes: 4_000_000_000,
  comparison: null,
  wouldTranscode: false,
  savesSpace: true,
};

const AT_720P = {
  quality: '720p' as const,
  label: '720p',
  meaning: 'Smaller',
  bytes: null,
  comparison: null,
  wouldTranscode: true,
  savesSpace: true,
};

const OFFER = {
  mediaId: 'arrival',
  title: 'Arrival',
  episodes: 1,
  options: [ORIGINAL, AT_720P],
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

  it('says a quality would be no smaller than the original, and greys it out', async () => {
    const asking = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_, picked) => {
        picked(2);
      });
    const bigger = {
      ...OFFER,
      options: [
        ORIGINAL,
        {
          ...AT_720P,
          bytes: 5_000_000_000,
          comparison: 'bigger than the original',
          savesSpace: false,
        },
      ],
    };

    await chooseADownloadQuality(bigger, 'Download Arrival');

    expect(asking.mock.lastCall?.[0].options[1]).toMatch(/bigger than the original$/u);
    expect(asking.mock.lastCall?.[0].disabledButtonIndices).toEqual([1]);
  });

  it('hands back nothing when somebody cancels', async () => {
    jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_, picked) => {
      picked(2);
    });

    await expect(chooseADownloadQuality(OFFER, 'Download Arrival')).resolves.toBeNull();
  });
});
