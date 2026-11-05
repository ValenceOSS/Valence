import { DIALOG_KINDS } from './DialogKind';
import type { DialogKind } from './DialogKind';

/**
 * Works out the order of the dialogs that are open, oldest first: those already open keep their
 * places, and any newly opened follow them in the order they would stack when arriving by address.
 *
 * @param order - The order as it stood.
 * @param open - Whether each kind of dialog is open now.
 * @returns The order now, the one to show last.
 */
const nextDialogOrder = (
  order: readonly DialogKind[],
  open: Readonly<Record<DialogKind, boolean>>,
): DialogKind[] => [
  ...order.filter((kind) => open[kind]),
  ...DIALOG_KINDS.filter((kind) => open[kind] && !order.includes(kind)),
];

export { nextDialogOrder };
