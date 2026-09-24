const SHARE_OF_THE_PICTURE = 4.5;

/**
 * How large a line of dialogue is drawn, as a share of the picture's own height — the way a
 * broadcaster sizes it — so it reads the same on a phone, a laptop and a television, and grows with
 * the player rather than staying the size of the page's text. The viewer's own scale multiplies it,
 * and it is never smaller than the page's text, however small the player.
 *
 * Measured against the box the lines are drawn in, which is the picture; see `SubtitleCues`.
 *
 * @param fontScale - The viewer's caption size, as a percentage.
 * @returns The CSS font size.
 */
const dialogueFontSize = (fontScale: number): string =>
  `calc(${(fontScale / 100).toString()} * max(1rem, ${SHARE_OF_THE_PICTURE.toString()}cqh))`;

export { dialogueFontSize };
