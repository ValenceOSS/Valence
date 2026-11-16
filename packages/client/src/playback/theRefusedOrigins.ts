const refused = new Set<string>();

/**
 * The linked servers' addresses this page could not stream from directly. Kept for as long as the
 * page is open, since what stopped it, such as the page's Content-Security-Policy, cannot change
 * until it is loaded again; a linked title from one of them is asked for through this server.
 *
 * @returns The addresses, by origin.
 */
const theRefusedOrigins = (): Set<string> => refused;

export { theRefusedOrigins };
