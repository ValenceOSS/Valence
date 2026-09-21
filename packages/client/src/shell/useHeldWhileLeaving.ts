import { useState } from 'react';

/**
 * Keeps the last value something had while it is on its way out, so that a panel goes on showing
 * what it was showing until it has finished leaving.
 *
 * A dialog here is dismissed by the thing it was opened for becoming nothing, and everything drawn
 * from that thing becomes nothing in the same render — the overview, the cast, the seasons. The
 * panel is still on screen for the length of its exit, so it spends that time as an empty box, and
 * an empty box fading out reads as the dialog having been cut rather than closed.
 *
 * While it is present the value is passed straight through, so a panel that is open and loading
 * something new shows that it is loading rather than the last thing it held. What it held is kept
 * in state rather than a ref, because a render that reads what an earlier render wrote is a render
 * whose answer depends on how many times it has run.
 *
 * @param value - What to show now.
 * @param isPresent - Whether the thing being shown is still there, as opposed to leaving.
 * @param identity - What counts as the same value, for a caller whose value is built fresh every
 *   render. Without one the value is compared to itself, and a new array each render would be a
 *   new value each render.
 * @returns The value while it is present, and the last one it had while it is not.
 */
const useHeldWhileLeaving = <Value>(value: Value, isPresent: boolean, identity?: string): Value => {
  const [held, setHeld] = useState<{ value: Value; identity: string | undefined }>({
    value,
    identity,
  });

  const hasChanged = identity === undefined ? held.value !== value : held.identity !== identity;

  if (isPresent && hasChanged) {
    setHeld({ value, identity });
  }

  return isPresent ? value : held.value;
};

export { useHeldWhileLeaving };
