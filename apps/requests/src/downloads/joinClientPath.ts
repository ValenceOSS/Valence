/**
 * Joins a path onto the address a client was given, whatever it ends with.
 *
 * @param base - The address, such as `http://qbittorrent:8080/` or `http://host/sabnzbd`.
 * @param path - The path, starting with a slash.
 * @returns The whole address.
 */
const joinClientPath = (base: string, path: string): string => `${base.replace(/\/+$/, '')}${path}`;

export { joinClientPath };
