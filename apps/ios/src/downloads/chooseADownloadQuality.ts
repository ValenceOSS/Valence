import { ActionSheetIOS } from 'react-native';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { DownloadOffer } from '@ValenceClient/downloads/fetchDownloads';
import type { DownloadQuality } from '@ValenceContracts/schemas/Download';

/**
 * Offers the qualities something can be downloaded at, each with what it costs, in the system's
 * action sheet.
 *
 * @param offer - What the server offered.
 * @param title - What the sheet is headed with.
 * @param message - A line under the heading, where one says more.
 * @returns The quality chosen, or null where somebody cancelled.
 */
const chooseADownloadQuality = async (
  offer: DownloadOffer,
  title: string,
  message?: string,
): Promise<DownloadQuality | null> => {
  const chosen = await new Promise<number>((settle) => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        ...(message === undefined ? {} : { message }),
        options: [
          ...offer.options.map((option) =>
            [option.label, option.bytes === null ? null : formatBytes(option.bytes)]
              .filter((part) => part !== null)
              .join(' · '),
          ),
          'Cancel',
        ],
        cancelButtonIndex: offer.options.length,
      },
      settle,
    );
  });

  return offer.options[chosen]?.quality ?? null;
};

export { chooseADownloadQuality };
