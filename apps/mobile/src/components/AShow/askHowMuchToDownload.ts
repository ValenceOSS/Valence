import { ActionSheetIOS } from 'react-native';
import type { AWayToDownload } from '@ValenceClient/downloads/waysToDownloadAProgramme.types';
import { say } from '@ValenceI18n/say';

/**
 * Offers the ways to download some of a programme in the system's action sheet: the season on
 * screen, every season, or picking.
 *
 * @param title - The programme, for the sheet's heading.
 * @param ways - What to offer, in order.
 * @returns The way chosen, or null where somebody cancelled.
 */
const askHowMuchToDownload = async (
  title: string,
  ways: readonly AWayToDownload[],
): Promise<AWayToDownload | null> => {
  const chosen = await new Promise<number>((settle) => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: say('phone.askHowMuchToDownload.title', { title }),
        options: [...ways.map((way) => way.label), say('common.cancel')],
        cancelButtonIndex: ways.length,
      },
      settle,
    );
  });

  return ways[chosen] ?? null;
};

export { askHowMuchToDownload };
