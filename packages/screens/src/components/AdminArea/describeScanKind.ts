import { say } from '@ValenceI18n/say';

const WORDS: Record<string, string> = {
  scan: say('screens.adminArea.describeScanKind.scanning'),
  rescan: say('screens.adminArea.describeScanKind.readingEveryFileIn'),
  regeneratePreviews: say('screens.adminArea.describeScanKind.regeneratingPreviewsFor'),
  'library.scan': say('screens.adminArea.describeScanKind.scanning'),
  'library.readAgain': say('screens.adminArea.describeScanKind.readingTheCorrectedFilesIn'),
  'library.regeneratePreviews': say('screens.adminArea.describeScanKind.regeneratingPreviewsFor'),
  'library.regenerateTrickplay': say(
    'screens.adminArea.describeScanKind.regeneratingThumbnailsFor',
  ),
  'library.detectSegments': say('screens.adminArea.describeScanKind.detectingIntrosIn'),
  'library.reset': say('screens.adminArea.describeScanKind.rebuilding'),
  'library.clearParts': say('screens.adminArea.describeScanKind.clearingPartsOf'),
};

/**
 * Names the work running against a library as a phrase reading into the library's own name, so the
 * progress bar says what is happening to what rather than pairing a code with a name.
 *
 * @param kind - The work being done, as the server reports it.
 * @param libraryName - The library it is being done to.
 * @returns The phrase to show.
 */
const describeScanKind = (kind: string, libraryName: string): string =>
  `${WORDS[kind] ?? say('screens.adminArea.describeScanKind.workingOn')} ${libraryName}`;

export { describeScanKind };
