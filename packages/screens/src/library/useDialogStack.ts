import { useEffect, useRef } from 'react';
import { useDialogOrder } from '@ValenceClient/dialogs/useDialogOrder';
import type { DialogKind } from '@ValenceClient/dialogs/DialogKind';

const SCROLLER = '[data-slot="dialog-scroller"]';

/**
 * Says which one of the open dialogs to draw, so that those beneath it are closed rather than kept
 * drawn out of sight, and are opened again when it goes, scrolled to where they were left.
 *
 * @param open - Whether each kind of dialog is open.
 * @returns The kind to draw, or null where none is open.
 */
const useDialogStack = (open: Readonly<Record<DialogKind, boolean>>): DialogKind | null => {
  const order = useDialogOrder(open);
  const top = order.at(-1) ?? null;
  const scrolled = useRef(new Map<DialogKind, number>());
  const orderKey = order.join();

  useEffect(() => {
    const open = new Set(orderKey.split(','));

    for (const kind of scrolled.current.keys()) {
      if (!open.has(kind)) {
        scrolled.current.delete(kind);
      }
    }
  }, [orderKey]);

  useEffect(() => {
    if (top === null) {
      return;
    }

    const remembered = scrolled.current;
    const listen = (event: Event) => {
      if (event.target instanceof Element && event.target.matches(SCROLLER)) {
        remembered.set(top, event.target.scrollTop);
      }
    };
    const asked = requestAnimationFrame(() => {
      const wanted = remembered.get(top);
      const scrollers = document.querySelectorAll(SCROLLER);

      if (wanted !== undefined) {
        scrollers.item(scrollers.length - 1).scrollTo({ top: wanted });
      }
    });

    document.addEventListener('scroll', listen, { capture: true, passive: true });

    return () => {
      cancelAnimationFrame(asked);
      document.removeEventListener('scroll', listen, { capture: true });
    };
  }, [top]);

  return top;
};

export { useDialogStack };
