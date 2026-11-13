const WHEEL_STEP = 50;

/**
 * Whether a wheel event came from a mouse wheel rather than a trackpad. A wheel turns in lines or
 * pages, or in whole steps of fifty pixels or more straight up and down; a trackpad scrolls in small,
 * fractional and often sideways amounts.
 *
 * @param event - The wheel event.
 * @returns Whether a mouse wheel turned.
 */
const isMouseWheel = (event: Pick<WheelEvent, 'deltaMode' | 'deltaX' | 'deltaY'>): boolean =>
  event.deltaMode !== 0 ||
  (event.deltaX === 0 && Math.abs(event.deltaY) >= WHEEL_STEP && Number.isInteger(event.deltaY));

export { isMouseWheel };
