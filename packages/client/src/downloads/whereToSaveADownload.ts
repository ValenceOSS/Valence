/**
 * Where a browser is sent to save a prepared file, which the server answers as an attachment named
 * for the film, so the browser downloads it rather than trying to play it or leaving the page.
 *
 * @param downloadId - The prepared download.
 * @returns The address.
 */
const whereToSaveADownload = (downloadId: string): string =>
  `/api/downloads/${encodeURIComponent(downloadId)}/file?save=1`;

export { whereToSaveADownload };
