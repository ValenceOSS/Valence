import { Avatar, Style } from '@dicebear/core';
import adventurer from '@dicebear/styles/adventurer.json' with { type: 'json' };
import bottts from '@dicebear/styles/bottts.json' with { type: 'json' };
import funEmoji from '@dicebear/styles/fun-emoji.json' with { type: 'json' };
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' };
import notionists from '@dicebear/styles/notionists.json' with { type: 'json' };
import thumbs from '@dicebear/styles/thumbs.json' with { type: 'json' };

/**
 * Draws one avatar in a style from its seed, on a colour where it is given one. The drawing fills
 * its square, so each app rounds it into its own shape.
 *
 * @param style - The style to draw in.
 * @returns What draws it from a seed and a colour.
 */
const drawnIn =
  <D>(style: Style<D>) =>
  (seed: string, colour: string | null): string =>
    new Avatar(style, {
      seed,
      ...(colour === null ? {} : { backgroundColor: [colour.replace('#', '')] }),
    }).toString();

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
 * @param colour - The profile's colour, drawn behind the face, or nothing to leave it clear.
 * @returns The avatar, as SVG.
 */
const drawAvatar = (style: AvatarStyle, seed: string, colour: string | null = null): string =>
  AVATAR_STYLES[style](seed, colour);

export type { AvatarStyle };

export { drawAvatar, isAvatarStyle, AVATAR_STYLES };
