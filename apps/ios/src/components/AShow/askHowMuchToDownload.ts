import { ActionSheetIOS } from 'react-native';
import type { AWayToDownload } from '@ValenceClient/downloads/waysToDownloadAProgramme.types';

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
        title: `Download ${title}`,
        options: [...ways.map((way) => way.label), 'Cancel'],
        cancelButtonIndex: ways.length,
      },
      settle,
    );
  });

  return ways[chosen] ?? null;
};

export { askHowMuchToDownload };
