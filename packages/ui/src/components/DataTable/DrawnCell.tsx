import type { DrawnCellProps } from './DrawnCell.types';

/**
 * Whatever goes in one cell of a table, drawn by a component that stays the same however the
 * columns change.
 *
 * A column says how to draw its cells with a function, and a caller has to hand over a new one
 * whenever what it draws depends on something that changed — which is most of the time, for a cell
 * holding a control. Were that function the component doing the drawing, as a table library's
 * `flexRender` makes it, React would see a different kind of thing in the cell each time and throw
 * away what was there: an animation part way through is lost, and a press about to land arrives at
 * an element that is no longer in the page.
 *
 * Calling the function here instead, and drawing what it returns, keeps each cell the element it
 * was for as long as it holds the same thing.
 *
 * @param draw - What to put in the cell, called afresh on every draw.
 */
const DrawnCell = ({ draw }: DrawnCellProps) => <>{draw()}</>;

DrawnCell.displayName = 'DrawnCell';

export { DrawnCell };
