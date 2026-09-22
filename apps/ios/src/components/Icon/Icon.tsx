import { View } from 'react-native';
import type { IconProps } from './Icon.types';

const HOW_HEAVY = 2;

/**
 * Every glyph on a phone, drawn through one component.
 *
 * A caller names the icon it wants and this decides how it is drawn. That indirection is the point,
 * and it has earned itself already: the set behind it has changed once and every place that draws
 * an icon changed nothing but the name it asked for.
 *
 * The set is Lucide rather than the one the browser client draws, because Lucide publishes a build
 * for React Native and Keyline publishes only a build for browsers — its components return `<svg>`,
 * which a phone has no element for. The two sets are drawn on the same grid at the same weight, so
 * a household looking at both clients sees the same shapes.
 *
 * @param of - The icon.
 * @param size - How large it is drawn.
 * @param colour - What colour to draw it, since these are the one thing here that does not inherit.
 * @param label - What it means, where nothing beside it says; without one it is passed over by
 *   anybody who cannot see it, since the words beside it already said it.
 * @param isFilled - Whether its shape is filled in, as a kept heart or a given star is.
 */
const Icon = ({ of: Glyph, size = 24, colour, label, isFilled = false }: IconProps) =>
  label === undefined ? (
    <View accessibilityElementsHidden>
      <Glyph size={size} color={colour} strokeWidth={HOW_HEAVY} fill={isFilled ? colour : 'none'} />
    </View>
  ) : (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      <Glyph size={size} color={colour} strokeWidth={HOW_HEAVY} fill={isFilled ? colour : 'none'} />
    </View>
  );

Icon.displayName = 'Icon';

export { Icon };
