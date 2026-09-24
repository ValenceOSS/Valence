import { askForDownload, fetchDownloadOffer } from '@ValenceClient/downloads/fetchDownloads';
import { thePhonesProfile } from '@ValenceMobile/playback/thePhonesProfile';
import { chooseADownloadQuality } from '@ValenceMobile/downloads/chooseADownloadQuality';
import { rememberAskedOnThisPhone } from '@ValenceMobile/downloads/rememberAskedOnThisPhone';

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

  const quality = await chooseADownloadQuality(offer, `Download ${title}`);

  if (quality === null) {
    return false;
  }

  const asked = await askForDownload(mediaId, quality);

  if (asked === null) {
    return false;
  }

  rememberAskedOnThisPhone(asked.id, true);

  return true;
};

export { askToKeepOnThisPhone };
