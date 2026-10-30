import { StyleSheet, Text } from 'react-native';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { WordsProps } from './Words.types';

const ON_ARTWORK = '#ffffff';

const ON_BRIGHT = '#000000';

const styles = StyleSheet.create({
  body: { fontFamily: FONTS.sans.semibold, fontSize: 15 },
  centred: { textAlign: 'center' },
  justified: { textAlign: 'justify' },
  heading: { fontFamily: FONTS.sans.semibold, fontSize: 19, letterSpacing: -0.2 },
  lead: { fontFamily: FONTS.sans.semibold, fontSize: 17 },
  leadLeading: { lineHeight: 25 },
  prose: { fontFamily: FONTS.sans.semibold, letterSpacing: 0.08 },
  proseLeading: { lineHeight: 21 },
  small: { fontFamily: FONTS.sans.semibold, fontSize: 12 },
  strong: { fontFamily: FONTS.sans.bold },
  title: { fontFamily: FONTS.sans.bold, fontSize: 30, letterSpacing: -0.9 },
});

/**
 * Anything written on a phone, at one of the five sizes there turned out to be.
 *
 * Five rather than a scale, because a scale invites a sixth and then the screens stop agreeing. The
 * fourth arrived with rows: a row needs a name that is clearly not the page's own, and neither the
 * page's title nor the words under it would do. The fifth arrived with cards: what a card is about
 * and what it is said to be read at a size between a heading and the words around it.
 *
 * Set in the web's face, Plus Jakarta Sans, for titles, names, prose and the quieter words around
 * them alike — at the weights the television app sets them, so the two read as one: titles bold,
 * headings semibold.
 *
 * @param children - What it says.
 * @param tone - How much it wants to be read.
 * @param size - How large it is.
 * @param lines - How many lines it may take before it is cut short.
 * @param isSelectable - Whether it can be held to select and copy, as a key or a code can.
 * @param isCentred - Whether its lines are centred, for words in the middle of a screen.
 * @param isJustified - Whether its lines run edge to edge, for a passage read as a block.
 * @param isProse - Whether it is running prose — a synopsis, a tagline — which is spaced a little
 *   more loosely than the words around it.
 * @param isStrong - Whether it is set bold, as a badge is, whatever else it is.
 * @param colour - A colour of its own, where it sits on a page that is not the theme's — a book's
 *   sepia or light page — and takes that page's ink rather than any tone.
 * @param onLines - Told how many lines it took once it is laid out, for a passage that offers to
 *   show the rest of itself.
 */
const Words = ({
  children,
  tone = 'plain',
  size = 'body',
  lines,
  isSelectable = false,
  isCentred = false,
  isJustified = false,
  isProse = false,
  isStrong = false,
  colour: asked,
  onLines,
}: WordsProps) => {
  const colours = useTheColours();
  const colour =
    asked ??
    (tone === 'muted'
      ? colours.textMuted
      : tone === 'danger'
        ? colours.danger
        : tone === 'accent'
          ? colours.accent
          : tone === 'onArtwork'
            ? ON_ARTWORK
            : tone === 'onBright'
              ? ON_BRIGHT
              : tone === 'onAccent'
                ? colours.accentContrast
                : colours.text);

  return (
    <Text
      style={[
        size === 'title'
          ? styles.title
          : size === 'heading'
            ? styles.heading
            : size === 'lead'
              ? styles.lead
              : size === 'small'
                ? styles.small
                : styles.body,
        { color: colour },
        (isProse || tone === 'muted') && size !== 'title' && size !== 'heading' && styles.prose,
        (isProse || tone === 'muted') && size === 'body' && styles.proseLeading,
        (isProse || tone === 'muted') && size === 'lead' && styles.leadLeading,
        isStrong && styles.strong,
        isCentred && styles.centred,
        isJustified && styles.justified,
      ]}
      {...(lines === undefined ? {} : { numberOfLines: lines })}
      selectable={isSelectable}
      {...(onLines === undefined
        ? {}
        : {
            onTextLayout: ({ nativeEvent }) => {
              onLines(nativeEvent.lines.length);
            },
          })}
    >
      {children}
    </Text>
  );
};

Words.displayName = 'Words';

export { Words };
