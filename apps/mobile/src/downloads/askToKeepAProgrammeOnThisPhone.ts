import { askForSeries, fetchSeriesDownloadOffer } from '@ValenceClient/downloads/fetchDownloads';
import { thePhonesProfile } from '@ValenceMobile/playback/thePhonesProfile';
import { chooseADownloadQuality } from '@ValenceMobile/downloads/chooseADownloadQuality';
import { rememberAskedOnThisPhone } from '@ValenceMobile/downloads/rememberAskedOnThisPhone';

/**
 * Offers the qualities some of a programme can be downloaded at, each costed across every episode
 * asked for, and asks the server to prepare them, remembering each so the phone fetches it once it
 * is ready.
 *
 * @param seriesId - The programme.
 * @param title - What it is called, for the sheet.
 * @param mediaIds - The episodes wanted.
 * @returns Whether anything was asked for.
 */
const askToKeepAProgrammeOnThisPhone = async (
  seriesId: string,
  title: string,
  mediaIds: readonly string[],
): Promise<boolean> => {
  if (mediaIds.length === 0) {
    return false;
  }

  const offer = await fetchSeriesDownloadOffer(seriesId, thePhonesProfile(), mediaIds);

  if (offer === null || offer.options.length === 0) {
    return false;
  }

  const quality = await chooseADownloadQuality(
    offer,
    `Download ${title}`,
    mediaIds.length === 1 ? '1 episode' : `${mediaIds.length.toString()} episodes`,
  );

  if (quality === null) {
    return false;
  }

  const asked = await askForSeries(seriesId, quality, [], mediaIds);

  for (const one of asked) {
    rememberAskedOnThisPhone(one.id, true);
  }

  return asked.length > 0;
};

export { askToKeepAProgrammeOnThisPhone };
