import { View } from 'react-native';
import type { IconProps } from './Icon.types';

/**
 * Every glyph on a phone, drawn through one component.
 *
 * A caller names the icon it wants and this decides how it is drawn. That indirection is the point,
 * and it has earned itself already: the set behind it has changed twice and every place that draws
 * an icon changed nothing but the name it asked for.
 *
 * The set is Keyline, the one the browser client draws, from its build for React Native, so a
 * household looking at both clients sees the same shapes. A filled icon is its own glyph, imported
 * from the set's filled build, as the browser client does it.
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
      <Glyph size={size} color={colour} />
    </View>
  ) : (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      <Glyph size={size} color={colour} />
    </View>
  );

Icon.displayName = 'Icon';

export { Icon };
