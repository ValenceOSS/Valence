import { cn } from '@ValenceUI/cn';
import type { EmbeddedVideoProps } from './EmbeddedVideo.types';

/**
 * The one place an `<iframe>` is written: a picture Valence does not hold, played by somebody else's
 * player inside somebody else's page.
 *
 * Everything Valence has on disk goes through `VideoSurface` instead. This is for the one thing it
 * does not have — a trailer that exists only on a catalogue's video host — and it is kept to a
 * single component so that the whole surface a third party is given can be read in one file.
 *
 * Sandboxed to what a video player needs and nothing more: it may run its own scripts and go full
 * screen, and it may not reach back into the page that framed it.
 *
 * @param label - What is playing, for anybody who cannot see it.
 * @param src - The address to frame.
 * @param className - Extra classes for the caller's own layout.
 */
const EmbeddedVideo = ({ label, src, className }: EmbeddedVideoProps) => (
  <iframe
    title={label}
    src={src}
    loading="lazy"
    referrerPolicy="strict-origin"
    sandbox="allow-scripts allow-same-origin allow-presentation"
     
    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
    allowFullScreen
    className={cn('aspect-video w-full border-0 bg-shade', className)}
  />
);

EmbeddedVideo.displayName = 'EmbeddedVideo';

export { EmbeddedVideo };
