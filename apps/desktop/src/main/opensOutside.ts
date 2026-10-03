/**
 * Whether an address the window was asked to open in a new window is handed to the system instead:
 * a web page, which opens in the default browser, or a calendar subscription, which opens in the
 * calendar app it belongs to. Anything else is opened nowhere.
 *
 * @param url - The address.
 * @returns Whether to hand it to the system.
 */
const opensOutside = (url: string): boolean => /^(?:https?|webcal):\/\//u.test(url);

export { opensOutside };
