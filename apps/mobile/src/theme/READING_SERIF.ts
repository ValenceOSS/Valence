import { Platform } from 'react-native';

/* oxlint-disable valence/no-hard-coded-strings -- the names of a typeface iOS ships, which the system looks up, not words anybody reads. */
const READING_SERIF = Platform.select({
  ios: {
    regular: 'Georgia',
    bold: 'Georgia-Bold',
    italic: 'Georgia-Italic',
    boldItalic: 'Georgia-BoldItalic',
  },
  default: { regular: 'serif', bold: 'serif', italic: 'serif', boldItalic: 'serif' },
});
/* oxlint-enable valence/no-hard-coded-strings */

export { READING_SERIF };
