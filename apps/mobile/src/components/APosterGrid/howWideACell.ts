const STEPS_A_POINT = 64;

/**
 * How wide each of a row of cells is drawn for the row to fill the room, rounded down to a 64th of
 * a point, which the layout holds exactly, so its sum of the row never comes to more than the room
 * and pushes the last cell onto a row of its own.
 *
 * @param room - How wide the row is.
 * @param across - How many cells are in it.
 * @param gap - How far apart they stand.
 * @returns How wide each cell is.
 */
const howWideACell = (room: number, across: number, gap: number): number =>
  Math.floor(((room - gap * (across - 1)) / across) * STEPS_A_POINT) / STEPS_A_POINT;

export { howWideACell };
