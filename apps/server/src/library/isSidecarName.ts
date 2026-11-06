import { extname } from 'node:path';
import { SIDECAR_EXTENSIONS } from '@ValenceServer/library/SIDECAR_EXTENSIONS';

/**
 * Whether a file is of a kind that belongs beside a video, such as subtitles, an NFO or a picture,
 * whatever video it belongs to.
 *
 * @param name - The file's name.
 * @returns Whether it is.
 */
const isSidecarName = (name: string): boolean =>
  SIDECAR_EXTENSIONS.has(extname(name).slice(1).toLowerCase());

export { isSidecarName };
