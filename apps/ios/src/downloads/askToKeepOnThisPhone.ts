import { ActionSheetIOS } from 'react-native';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { askForDownload, fetchDownloadOffer } from '@ValenceClient/downloads/fetchDownloads';
import { thePhonesProfile } from '@ValencePhone/playback/thePhonesProfile';
import { rememberAskedOnThisPhone } from '@ValencePhone/downloads/rememberAskedOnThisPhone';

/**
 * Offers the qualities a title can be downloaded at, in the system's action sheet, and asks the
 * server to prepare the one chosen, remembering it so the phone fetches it once it is ready.
 *
 * @param mediaId - What to download.
 * @param title - What it is called, for the sheet.
 * @returns Whether something was asked for.
 */
const askToKeepOnThisPhone = async (mediaId: string, title: string): Promise<boolean> => {
  const offer = await fetchDownloadOffer(mediaId, thePhonesProfile());

  if (offer === null || offer.options.length === 0) {
    return false;
  }

  const chosen = await new Promise<number>((settle) => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: `Download ${title}`,
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
  const option = offer.options[chosen];

  if (option === undefined) {
    return false;
  }

  const asked = await askForDownload(mediaId, option.quality);

  if (asked === null) {
    return false;
  }

  rememberAskedOnThisPhone(asked.id, true);

  return true;
};

export { askToKeepOnThisPhone };
