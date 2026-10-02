import { StyleSheet } from 'react-native';
import { FONTS } from '@ValenceMobile/theme/FONTS';

const OVER_THE_PICTURE = '#ffffff';

const QUIETLY = 'rgba(255, 255, 255, 0.6)';

const SIDE_PANEL = {
  edge: 24,
  colours: { text: OVER_THE_PICTURE, quiet: QUIETLY, panel: 'rgba(12, 12, 12, 0.96)' },
  styles: StyleSheet.create({
    chosenRow: { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
    disabledRow: { opacity: 0.5 },
    detail: { color: QUIETLY, fontFamily: FONTS.sans.semibold, fontSize: 12 },
    heading: {
      color: QUIETLY,
      fontSize: 12,
      fontFamily: FONTS.sans.bold,
      letterSpacing: 0.8,
      paddingBottom: 6,
      textTransform: 'uppercase',
    },
    label: { color: OVER_THE_PICTURE, flex: 1, fontFamily: FONTS.sans.semibold, fontSize: 15 },
    note: { color: QUIETLY, fontFamily: FONTS.sans.medium, fontSize: 13, lineHeight: 18 },
    row: {
      alignItems: 'center',
      borderRadius: 10,
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 11,
    },
  }),
} as const;

export { SIDE_PANEL };
