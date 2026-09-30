import type { Said } from './SaidSchema';

/**
 * Something passed on exactly as it came from elsewhere — a download client, a plugin, the system —
 * with no code, since there are no words of ours to translate it with.
 *
 * @param message - The text as it came.
 */
const sayVerbatim = (message: string): Said => ({ code: null, message, values: {} });

export { sayVerbatim };
