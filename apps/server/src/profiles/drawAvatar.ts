import { Avatar, Style } from '@dicebear/core';
import adventurer from '@dicebear/styles/adventurer.json' with { type: 'json' };
import bottts from '@dicebear/styles/bottts.json' with { type: 'json' };
import funEmoji from '@dicebear/styles/fun-emoji.json' with { type: 'json' };
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };
import notionists from '@dicebear/styles/notionists.json' with { type: 'json' };
import thumbs from '@dicebear/styles/thumbs.json' with { type: 'json' };

/**
 * Draws one avatar in a style, round, from its seed.
 *
 * @param style - The style to draw in.
 * @returns What draws it from a seed.
 */
const drawnIn =
  <D>(style: Style<D>) =>
  (seed: string): string =>
    new Avatar(style, { seed, borderRadius: 50 }).toString();

const AVATAR_STYLES = {
  adventurer: drawnIn(new Style(adventurer)),
  lorelei: drawnIn(new Style(lorelei)),
  notionists: drawnIn(new Style(notionists)),
  bottts: drawnIn(new Style(bottts)),
  funEmoji: drawnIn(new Style(funEmoji)),
  thumbs: drawnIn(new Style(thumbs)),
} as const;

type AvatarStyle = keyof typeof AVATAR_STYLES;

/**
 * Decides whether a stored value names a style Valence actually draws, so a value written by a newer
 * version falls back rather than rendering nothing.
 *
 * @param candidate - The style as stored.
 * @returns Whether it is one Valence can draw.
 */
const isAvatarStyle = (candidate: string): candidate is AvatarStyle =>
  Object.hasOwn(AVATAR_STYLES, candidate);

/**
 * Draws a profile's avatar as an SVG, built from the style and colours it was given. Drawn here
 * rather than fetched, so a household's faces never leave the server and never depend on one.
 *
 * @param style - The style to draw in.
 * @param seed - What the drawing is derived from, so the same profile is always drawn the same.
 * @returns The avatar, as SVG.
 */
const drawAvatar = (style: AvatarStyle, seed: string): string => AVATAR_STYLES[style](seed);

export type { AvatarStyle };

export { drawAvatar, isAvatarStyle, AVATAR_STYLES };
