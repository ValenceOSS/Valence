/**
 * How many cards fit across, given the room there is and the least a card may be.
 *
 * @param width - How wide the grid is.
 * @param least - The narrowest a card may be drawn.
 * @param gap - The room between two cards.
 * @returns How many fit, never fewer than one.
 */
const columnsIn = (width: number, least: number, gap: number): number =>
  Math.max(Math.floor((width + gap) / (least + gap)), 1);

export { columnsIn };
