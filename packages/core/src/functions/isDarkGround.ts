import { channelsOf } from '@ValenceCore/functions/channelsOf';

const DARK_BELOW = 0.03;

/**
 * Whether a colour is dark enough that something laid on it should be lighter than it, rather than
 * darker: near black, as a plain dark page is, rather than a colour of its own.
 *
 * @param colour - The colour beneath.
 * @returns Whether it is that dark; a colour that cannot be read counts as dark.
 */
const isDarkGround = (colour: string): boolean => {
  const channels = channelsOf(colour);

  if (channels === null) {
    return true;
  }

  const [red, green, blue] = channels.map((channel) => {
    const share = channel / 255;

    return share <= 0.04045 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0) < DARK_BELOW;
};

export { isDarkGround };
