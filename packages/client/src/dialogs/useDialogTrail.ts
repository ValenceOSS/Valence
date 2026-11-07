import { useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dialogStackSlice } from './dialogStackSlice';
import { nextDialogTrail } from './nextDialogTrail';
import type { createDialogStore } from './createDialogStore';
import type { DialogStep } from './DialogStep';

type DialogStackState = ReturnType<ReturnType<typeof createDialogStore>['getState']>;

/**
 * Keeps the trail of dialogs that led to the one showing, which the address cannot hold: it has room
 * for one film, so a film opened from a film's cast takes the first one's place.
 *
 * @param step - The dialog showing now, null where none is, or undefined while it is still loading.
 * @returns The dialog to go back to, or null where this one was not opened from another.
 */
const useDialogTrail = (step: DialogStep | null | undefined): DialogStep | null => {
  const dispatch = useDispatch();
  const stored = useSelector((state: DialogStackState) => state.dialogStack.trail);
  const trail = step === undefined ? stored : nextDialogTrail(stored, step);
  const isChanged = JSON.stringify(trail) !== JSON.stringify(stored);

  useLayoutEffect(() => {
    if (isChanged) {
      dispatch(dialogStackSlice.actions.trailChanged(trail));
    }
  });

  return trail.at(-2) ?? null;
};

export { useDialogTrail };
