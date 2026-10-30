import { webpSourcesOf } from '@ValenceLanding/webpSourcesOf';

const ROOM = '/hero/living-room.jpg';

/**
 * The room the television stands in, at night: a lamp on the left, shelves on the right, a sofa
 * and a low table in front, and the screen itself dark until something is put on it.
 */
const RoomLayer = () => (
  <img
    src={ROOM}
    srcSet={webpSourcesOf(ROOM, [800, 1600])}
    sizes="(min-width: 640px) 84rem, 200vw"
    width={1672}
    height={941}
    alt=""
    aria-hidden
    loading="eager"
    draggable={false}
    className="absolute inset-0 block h-full w-full select-none"
  />
);

RoomLayer.displayName = 'RoomLayer';

export { RoomLayer };
