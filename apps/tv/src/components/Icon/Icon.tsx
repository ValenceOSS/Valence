import type { IconProps } from './Icon.types';

/**
 * One of Valence's icons: the one component that draws an icon on the television, as ValenceUI's
 * `Icon` is on the web. The icons are Keyline's native set, drawn from the same pictures as the
 * web's, so an icon changes in one place for every client and nobody draws one by hand.
 *
 * @param of - Which icon.
 * @param size - How wide and tall it is.
 * @param colour - What colour it is drawn in.
 */
const Icon = ({ of: Drawn, size = 32, colour }: IconProps) => <Drawn size={size} color={colour} />;

Icon.displayName = 'Icon';

export { Icon };
