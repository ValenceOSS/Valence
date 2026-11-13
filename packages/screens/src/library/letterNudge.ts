import type { LetterShape } from '@ValenceScreens/library/LetterShape';

/**
 * How far to move a letter from where a browser sets it so it looks centred in its circle, as a
 * share of its size. A browser centres the letter's advance and the font's whole line, which leaves
 * a capital high or low by however the font spaces its lines and a slanted or lopsided one to a side.
 * The letter is moved so the box around its ink sits in the middle from top to bottom, and from side
 * to side halfway between that box's middle and where its ink weighs, so a letter heavy on one side
 * is not seen to lean that way.
 *
 * @param shape - The letter as measured, every length a share of its size, from where the pen starts
 *   on the baseline.
 * @returns The move across and down, each a share of its size.
 */
const letterNudge = (shape: LetterShape): { x: number; y: number } => {
  const inkMiddleAcross = (shape.inkRight - shape.inkLeft) / 2;
  const seenAcross = (inkMiddleAcross + shape.weightAcross) / 2;
  const lineMiddleDown = (shape.fontDescent - shape.fontAscent) / 2;
  const inkMiddleDown = (shape.inkDescent - shape.inkAscent) / 2;

  return {
    x: shape.width / 2 - seenAcross,
    y: lineMiddleDown - inkMiddleDown,
  };
};

export { letterNudge };
