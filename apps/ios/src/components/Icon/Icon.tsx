import { SvgXml } from 'react-native-svg';
import { theGlyphs } from '@ValencePhone/theme/theGlyphs';
import type { IconProps } from './Icon.types';

/**
 * Every glyph on a phone, drawn from the same set as every other client through one component.
 *
 * The set publishes React components that return `<svg>`, which React Native has no element for,
 * so the drawings are lifted out of it at build time and kept in `theGlyphs`. A caller names what
 * it wants and this decides how it is drawn, which is the same bargain the browser client keeps —
 * the set behind it has changed before, and everywhere that drew an icon changed nothing.
 *
 * @param of - The icon.
 * @param size - How large it is drawn.
 * @param colour - What colour to draw it, since these are the one thing here that does not inherit.
 * @param label - What it means, where nothing beside it says; without one it is passed over by
 *   anybody who cannot see it, since the words beside it already said it.
 */
const Icon = ({ of: glyph, size = 24, colour, label }: IconProps) => (
  <SvgXml
    xml={theGlyphs[glyph]}
    width={size}
    height={size}
    color={colour}
    {...(label === undefined
      ? { accessibilityElementsHidden: true }
      : { accessible: true, accessibilityRole: 'image', accessibilityLabel: label })}
  />
);

Icon.displayName = 'Icon';

export { Icon };
