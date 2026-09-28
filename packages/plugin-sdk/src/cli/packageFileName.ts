/**
 * The name a packed plugin is saved under, so every build of a version has the same name.
 *
 * @param id - The plugin's id.
 * @param version - Its version.
 * @returns The file name, such as `anilist-1.0.0.vplugin`.
 */
const packageFileName = (id: string, version: string): string => `${id}-${version}.vplugin`;

export { packageFileName };
