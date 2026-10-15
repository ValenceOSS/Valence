import { StyleSheet } from 'react-native';
import { FONTS } from '@ValenceMobile/theme/FONTS';

const TEXT = '#ffffff';

const QUIET = 'rgba(255, 255, 255, 0.62)';

const PLAYED = '#f5d589';

const PLAYER_LOOK = {
  colours: {
    text: TEXT,
    quiet: QUIET,
    played: PLAYED,
    rest: 'rgba(255, 255, 255, 0.28)',
    ahead: 'rgba(255, 255, 255, 0.5)',
    marked: 'rgba(255, 255, 255, 0.85)',
    notch: 'rgba(0, 0, 0, 0.7)',
    scrim: 'rgba(0, 0, 0, 0.5)',
    panel: 'rgba(14, 14, 14, 0.96)',
    chip: 'rgba(255, 255, 255, 0.14)',
    chipChosen: 'rgba(255, 255, 255, 0.92)',
    line: 'rgba(255, 255, 255, 0.16)',
  },
  edge: 28,
  icon: 26,
  middle: 44,
  slot: 44,
  styles: StyleSheet.create({
    heading: { color: TEXT, fontFamily: FONTS.sans.bold, fontSize: 22 },
    label: { color: QUIET, fontFamily: FONTS.sans.semibold, fontSize: 17 },
    labelChosen: { color: TEXT, fontFamily: FONTS.sans.bold, fontSize: 17 },
    small: { color: QUIET, fontFamily: FONTS.sans.semibold, fontSize: 13 },
    action: { color: TEXT, fontFamily: FONTS.sans.semibold, fontSize: 15 },
  }),
} as const;

export { PLAYER_LOOK };
