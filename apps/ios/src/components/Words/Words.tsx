import { StyleSheet, Text } from 'react-native';
import { FONTS } from '@ValencePhone/theme/FONTS';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { WordsProps } from './Words.types';

const ON_ARTWORK = '#ffffff';

const ON_BRIGHT = '#000000';

const styles = StyleSheet.create({
  body: { fontFamily: FONTS.sans.regular, fontSize: 15 },
  centred: { textAlign: 'center' },
  heading: { fontFamily: FONTS.sans.semibold, fontSize: 19, letterSpacing: -0.2 },
  prose: { fontFamily: FONTS.body.regular, letterSpacing: 0.08 },
  small: { fontFamily: FONTS.sans.regular, fontSize: 12 },
  strong: { fontFamily: FONTS.sans.bold },
  title: { fontFamily: FONTS.sans.bold, fontSize: 30, letterSpacing: -0.9 },
});

/**
 * Anything written on a phone, at one of the four sizes there turned out to be.
 *
 * Four rather than a scale, because a scale invites a fifth and then the screens stop agreeing. The
 * fourth arrived with rows: a row needs a name that is clearly not the page's own, and neither the
 * page's title nor the words under it would do.
 *
 * Set in the web's faces: Gilroy for titles, names and everything that labels something, and
 * Manrope for prose and the quieter words around it, as the web sets paragraphs — at the weights
 * the television app sets them, so the two read as one: titles bold, headings semibold.
 *
 * @param children - What it says.
 * @param tone - How much it wants to be read.
 * @param size - How large it is.
 * @param lines - How many lines it may take before it is cut short.
 * @param isSelectable - Whether it can be held to select and copy, as a key or a code can.
 * @param isCentred - Whether its lines are centred, for words in the middle of a screen.
 * @param isProse - Whether it is running prose — a synopsis, a tagline — which is set in the web's
 *   body face as muted words already are, rather than the face everything else is set in.
 * @param isStrong - Whether it is set bold, as a badge is, whatever else it is.
 * @param colour - A colour of its own, where it sits on a page that is not the theme's — a book's
 *   sepia or light page — and takes that page's ink rather than any tone.
 */
const Words = ({
  children,
  tone = 'plain',
  size = 'body',
  lines,
  isSelectable = false,
  isCentred = false,
  isProse = false,
  isStrong = false,
  colour: asked,
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
            : size === 'small'
              ? styles.small
              : styles.body,
        { color: colour },
        (isProse || tone === 'muted') && size !== 'title' && size !== 'heading' && styles.prose,
        isStrong && styles.strong,
        isCentred && styles.centred,
      ]}
      {...(lines === undefined ? {} : { numberOfLines: lines })}
      selectable={isSelectable}
    >
      {children}
    </Text>
  );
};

Words.displayName = 'Words';

export { Words };
