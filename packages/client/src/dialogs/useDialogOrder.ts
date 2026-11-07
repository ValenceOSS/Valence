import { useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dialogStackSlice } from './dialogStackSlice';
import { nextDialogOrder } from './nextDialogOrder';
import type { createDialogStore } from './createDialogStore';
import type { DialogKind } from './DialogKind';

type DialogStackState = ReturnType<ReturnType<typeof createDialogStore>['getState']>;

/**
 * Keeps the order the open dialogs were opened in. The address says what is open, which keeps links
 * and the back button working; this only remembers which came last.
 *
 * @param open - Whether each kind of dialog is open.
 * @returns The order, oldest first.
 */
const useDialogOrder = (open: Readonly<Record<DialogKind, boolean>>): DialogKind[] => {
  const dispatch = useDispatch();
  const stored = useSelector((state: DialogStackState) => state.dialogStack.order);
  const order = nextDialogOrder(stored, open);
  const isChanged = order.join() !== stored.join();

  useLayoutEffect(() => {
    if (isChanged) {
      dispatch(dialogStackSlice.actions.orderChanged(order));
    }
  });

  return order;
};

export { useDialogOrder };
