const ATTRIBUTE_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '"': '&quot;',
  '<': '&lt;',
  '>': '&gt;',
};

/**
 * Gives the web app's page the tag that has Safari on an iPhone offer the Valence app above it: Open
 * where the app is installed, which takes it to `link`, and Get where it is not. A page with no head
 * is left as it is.
 *
 * @param page - The page.
 * @param appStoreId - The app's App Store listing.
 * @param link - Where Open takes the app.
 * @returns The page with the tag.
 */
const withTheAppStoreBanner = (page: string, appStoreId: string, link: string): string => {
  const content = `app-id=${appStoreId}, app-argument=${link}`.replace(
    /[&"<>]/gu,
    (character) => ATTRIBUTE_ESCAPES[character] ?? character,
  );

  return page.replace('</head>', `<meta name="apple-itunes-app" content="${content}"></head>`);
};

export { withTheAppStoreBanner };
