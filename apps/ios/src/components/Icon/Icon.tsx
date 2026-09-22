import { View } from 'react-native';
import type { IconProps } from './Icon.types';

/**
 * Every glyph on a phone, drawn from the same set as every other client through one component.
 *
 * A caller names the icon it wants and this decides how it is drawn, which is the same bargain the
 * browser client keeps — the set behind it has changed before, and everywhere that drew an icon
 * changed nothing but the name it asked for.
 *
 * The set publishes components that return `<svg>`, which React Native has no element for, so the
 * shapes are lifted out of it at build time and written as components of the kind a phone does
 * have. They are generated rather than drawn by hand: a shape somebody typed is a shape nobody can
 * check against the set it came from.
 *
 * @param of - The icon.
 * @param size - How large it is drawn.
 * @param colour - What colour to draw it, since these are the one thing here that does not inherit.
 * @param label - What it means, where nothing beside it says; without one it is passed over by
 *   anybody who cannot see it, since the words beside it already said it.
 */
const Icon = ({ of: Glyph, size = 24, colour, label }: IconProps) =>
  label === undefined ? (
    <View accessibilityElementsHidden>
      <Glyph size={size} colour={colour} />
    </View>
  ) : (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      <Glyph size={size} colour={colour} />
    </View>
  );

Icon.displayName = 'Icon';

export { Icon };
