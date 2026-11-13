import { useState } from 'react';
import { FramedPicture } from '@ValenceUI/FramedPicture';
import { PictureFramer } from '@ValenceUI/PictureFramer';

const ART = '/downloads-header.jpg';

/**
 * A wide picture dragged into a circle, with the square it makes beside it, as a profile picture
 * is placed after it is uploaded.
 */
const PictureFramerDemo = () => {
  const [frame, setFrame] = useState({ zoom: 1, x: 0, y: 0 });

  return (
    <div className="flex items-center gap-6">
      <PictureFramer
        src={ART}
        frame={frame}
        aspect={1}
        mostZoom={4}
        label="Where the picture sits"
        shape="circle"
        onFrame={setFrame}
        className="h-48 w-72"
      />
      <span className="relative block size-16 overflow-hidden rounded-lg">
        <FramedPicture src={ART} frame={frame} aspect={1} />
      </span>
    </div>
  );
};

PictureFramerDemo.displayName = 'PictureFramerDemo';

export { PictureFramerDemo };
