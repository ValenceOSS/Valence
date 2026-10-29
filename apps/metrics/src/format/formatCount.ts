const WHOLE = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

/**
 * Writes a count with its thousands grouped, the same way on the server as in the browser.
 *
 * @param count - The count.
 * @returns The count, written out.
 */
const formatCount = (count: number): string => WHOLE.format(count);

export { formatCount };
