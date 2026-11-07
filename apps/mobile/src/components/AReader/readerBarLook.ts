import { StyleSheet } from 'react-native';
import { mixColours } from '@ValenceCore/functions/mixColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { ViewStyle } from 'react-native';

/**
 * How the reader's floating bars stand off the page: on a light page, a shade darker than the paper
 * with a fine edge and a soft shadow; on a dark page, a little lighter than the paper with a deeper
 * shadow. Either way the bars read as their own layer whatever the theme.
 *
 * @param paper - The colour of the page.
 * @param ink - The colour of its words.
 * @param isDark - Whether the page is dark.
 * @returns The bar's background, edge and shadow.
 */
const readerBarLook = (paper: string, ink: string, isDark: boolean): ViewStyle =>
  isDark
    ? {
        backgroundColor: mixColours(paper, ink, 0.1),
        borderColor: withAlpha(ink, 0.08),
        borderWidth: StyleSheet.hairlineWidth,
        shadowColor: '#000000',
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      }
    : {
        backgroundColor: mixColours(paper, ink, 0.14),
        borderColor: withAlpha(ink, 0.14),
        borderWidth: StyleSheet.hairlineWidth,
        shadowColor: '#000000',
        shadowOffset: { height: 6, width: 0 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
      };

export { readerBarLook };
