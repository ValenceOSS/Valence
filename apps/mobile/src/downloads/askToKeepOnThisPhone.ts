import { askForDownload, fetchDownloadOffer } from '@ValenceClient/downloads/fetchDownloads';
import { thePhonesProfile } from '@ValenceMobile/playback/thePhonesProfile';
import { chooseADownloadQuality } from '@ValenceMobile/downloads/chooseADownloadQuality';

/**
 * Offers the qualities a title can be downloaded at, in the system's action sheet, and asks the
 * server to prepare the one chosen, which this phone then fetches once it is ready.
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

  return (await askForDownload(mediaId, quality)) !== null;
};

export { askToKeepOnThisPhone };
