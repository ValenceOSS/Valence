/**
 * Keeps a right click to the page, so the webview shows no menu of its own over the app, as the
 * Electron app did.
 *
 * @param document - The page's document.
 */
const keepRightClicksToThePage = (document: Document): void => {
  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
};

export { keepRightClicksToThePage };
