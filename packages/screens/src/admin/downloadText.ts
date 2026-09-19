import { downloadFile } from '@ValenceScreens/admin/downloadFile';

/**
 * Hands the reader a text file.
 *
 * Built and released in the browser rather than fetched from the server, because what is being saved
 * is what is on screen — already filtered, already read — rather than a fresh query somebody has not
 * seen the contents of.
 *
 * @param name - What to call the file.
 * @param text - What goes in it.
 */
const downloadText = (name: string, text: string): void => {
  downloadFile(name, new Blob([text], { type: 'text/plain;charset=utf-8' }));
};

export { downloadText };
