import { Platform } from 'react-native';

const READING_SERIF = Platform.select({
  // oxlint-disable-next-line valence/no-hard-coded-strings -- the names of a typeface iOS ships, which the system looks up, not words anybody reads.
  ios: { regular: 'Georgia', bold: 'Georgia-Bold' },
  default: { regular: 'serif', bold: 'serif' },
});

export { READING_SERIF };
