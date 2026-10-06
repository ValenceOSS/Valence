const OVER_DIALOGS = 'data-over-dialogs';

/**
 * Whether something pressed or focused sits in chrome that stays usable while a dialog is open, such
 * as the desktop's window bar, which a press on should reach rather than close the dialog.
 *
 * @param target - What was pressed or focused.
 * @returns Whether it is inside something marked as staying over dialogs.
 */
const isOverDialogs = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(`[${OVER_DIALOGS}]`) !== null;

export { isOverDialogs, OVER_DIALOGS };
