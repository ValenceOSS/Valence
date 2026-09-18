/**
 * Whether a pointer leaving the picture means the viewer has gone, and the controls should go with
 * them.
 *
 * Only a mouse can say that. A touch pointer stops existing the moment the finger lifts, so a
 * browser fires a leave straight after every single tap — and taking the controls away on that
 * undoes the very tap that asked for them. That was the whole of the player being unusable on a
 * phone: press, controls appear, controls vanish, in one frame. On a finger it is the idle timer
 * that takes them away, and nothing else.
 *
 * @param pointerType - What kind of pointer left, as the event reports it.
 * @returns Whether to hide the controls because of it.
 */
const aLeaveWorthHiding = (pointerType: string): boolean => pointerType === 'mouse';

export { aLeaveWorthHiding };
