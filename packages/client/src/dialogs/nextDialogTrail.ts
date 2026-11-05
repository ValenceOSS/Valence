import type { DialogStep } from './DialogStep';

/**
 * Works out the dialogs that led to the one showing: one seen before cuts the trail back to it, so
 * that going back and the browser's own back button both shorten it.
 *
 * @param trail - The trail as it stood, oldest first.
 * @param step - The dialog showing now, or null where none is.
 * @returns The trail now, the dialog showing last.
 */
const nextDialogTrail = (trail: readonly DialogStep[], step: DialogStep | null): DialogStep[] => {
  if (step === null) {
    return [];
  }

  const seenAt = trail.findIndex((one) => one.key === step.key);

  return seenAt === -1 ? [...trail, step] : [...trail.slice(0, seenAt), step];
};

export { nextDialogTrail };
