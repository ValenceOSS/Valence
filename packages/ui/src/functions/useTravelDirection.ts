import { useState } from 'react';

/**
 * Which way somebody moved through a row of tabs: forwards where the one they chose sits after the
 * one they were on, and backwards where it sits before it.
 *
 * So that what arrives can come in from the side it was reached from, the way a submenu does. A
 * panel that always slides in from the same side says nothing about where you went; one that comes
 * from the direction you travelled makes going back feel like going back.
 *
 * What is kept is the answer rather than the tab it was worked out from, because a redraw is not a
 * move: a component re-rendered for some reason of its own would otherwise find itself already on
 * the tab it was going to and call the journey forwards, reversing a slide halfway through it.
 *
 * @param order - The tabs, in the order they are offered.
 * @param value - The tab now showing.
 * @returns 1 where the move was forwards, -1 where it was backwards.
 */
const useTravelDirection = (order: readonly string[], value: string): 1 | -1 => {
  const [travelled, setTravelled] = useState<{ to: string; direction: 1 | -1 }>({
    to: value,
    direction: 1,
  });

  if (travelled.to !== value) {
    const from = order.indexOf(travelled.to);
    const to = order.indexOf(value);

    setTravelled({ to: value, direction: to < from ? -1 : 1 });
  }

  return travelled.direction;
};

export { useTravelDirection };
