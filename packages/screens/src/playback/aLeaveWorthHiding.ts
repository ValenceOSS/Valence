type LeavePoint = {
  x: number;
  y: number;
};

type LeaveBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

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
 * And only a mouse that is actually somewhere else. Windows reports a leave while the pointer is
 * still over the picture: when it crosses the strip the window is dragged by, which the system
 * counts as outside the page, and when the window controls are recoloured as the player's own come
 * and go. Hiding on those took the controls away the moment they appeared, which recoloured the
 * window controls, which reported another leave. A leave from inside the picture is left to the
 * idle timer.
 *
 * @param pointerType - What kind of pointer left, as the event reports it.
 * @param point - Where the event says the pointer was.
 * @param bounds - Where the picture is.
 * @returns Whether to hide the controls because of it.
 */
const aLeaveWorthHiding = (pointerType: string, point: LeavePoint, bounds: LeaveBounds): boolean =>
  pointerType === 'mouse' &&
  !(
    point.x > bounds.left &&
    point.x < bounds.right &&
    point.y > bounds.top &&
    point.y < bounds.bottom
  );

export type { LeavePoint, LeaveBounds };

export { aLeaveWorthHiding };
