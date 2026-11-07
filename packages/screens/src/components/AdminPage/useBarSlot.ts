import { useEffect, useState } from 'react';

/**
 * Finds a place in the bar along the top of the admin area that something written further down the
 * page can be drawn into.
 *
 * @param id - The place's ID.
 * @returns The place, once the bar is drawn.
 */
const useBarSlot = (id: string): HTMLElement | null => {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById(id));
  }, [id]);

  return slot;
};

export { useBarSlot };
