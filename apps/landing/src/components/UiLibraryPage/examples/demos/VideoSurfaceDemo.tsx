import { useRef } from 'react';
import { VideoSurface } from '@ValenceUI/VideoSurface';

/**
 * The surface every video in Valence plays on, here waiting on its poster, as it stands before a
 * film has been chosen to play.
 */
const VideoSurfaceDemo = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-xl">
      <VideoSurface
        label="A film, waiting to play"
        videoRef={videoRef}
        poster="/hero-3.jpeg"
        className="aspect-video object-cover"
      />
    </div>
  );
};

VideoSurfaceDemo.displayName = 'VideoSurfaceDemo';

export { VideoSurfaceDemo };
