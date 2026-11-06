import { extname } from 'node:path';
import { SIDECAR_EXTENSIONS } from '@ValenceServer/library/SIDECAR_EXTENSIONS';

/**
 * Whether a file beside a film belongs to it alone: named for it, as `Arrival.en.srt` or
 * `Arrival-poster.jpg` are for `Arrival.mkv`, and of a kind that is only ever kept beside something
 * else. Another film is never one, so `Arrival.Extended.mkv` stays where it is.
 *
 * @param name - The name of the file beside it.
 * @param stem - The film's own name, without its extension.
 * @returns Whether it goes with the film.
 */
const isSidecarOf = (name: string, stem: string): boolean =>
  (name.startsWith(`${stem}.`) || name.startsWith(`${stem}-`)) &&
  SIDECAR_EXTENSIONS.has(extname(name).slice(1).toLowerCase());

export { isSidecarOf };
