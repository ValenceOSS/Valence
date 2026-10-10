import { FaceCircle } from '@ValenceScreens/components/FaceCircle/FaceCircle';
import type { ServerFaceProps } from './ServerFace.types';

const AN_INITIAL = { kind: 'initial', font: 'gilroy' } as const;

const A_PHOTO = { kind: 'photo', isVideo: false, frame: null } as const;

/**
 * What a server is shown by: the picture its admin gave it, or else its initial in its colour.
 *
 * @param name - The server's name, whose initial stands in for a picture.
 * @param colour - The server's colour.
 * @param picture - Where its picture is read from, or null where it has none.
 * @param pending - A picture being uploaded, drawn in place of the stored one.
 * @param className - Extra classes for the caller's own layout.
 */
const ServerFace = ({ name, colour, picture, pending = null, className }: ServerFaceProps) => (
  <FaceCircle
    name={name}
    colour={colour}
    avatar={picture === null && pending === null ? AN_INITIAL : A_PHOTO}
    source={picture ?? ''}
    pending={pending}
    {...(className === undefined ? {} : { className })}
  />
);

ServerFace.displayName = 'ServerFace';

export { ServerFace };
