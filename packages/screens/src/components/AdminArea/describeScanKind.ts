import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const WORDS: Partial<Record<string, StringKey>> = {
  scan: 'admin.describeScanKind.scan',
  rescan: 'admin.describeScanKind.rescan',
  regeneratePreviews: 'admin.describeScanKind.regeneratePreviews',
  'library.scan': 'admin.describeScanKind.scan',
  'library.readAgain': 'admin.describeScanKind.readAgain',
  'library.regeneratePreviews': 'admin.describeScanKind.regeneratePreviews',
  'library.regenerateTrickplay': 'admin.describeScanKind.regenerateTrickplay',
  'library.detectSegments': 'admin.describeScanKind.detectSegments',
  'library.reset': 'admin.describeScanKind.reset',
  'library.clearParts': 'admin.describeScanKind.clearParts',
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
  say(WORDS[kind] ?? 'admin.describeScanKind.other', { name: libraryName });

export { describeScanKind };
