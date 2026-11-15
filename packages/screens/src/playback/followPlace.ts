const HAS_A_PICTURE = 2;

const CAUGHT_UP_WITHIN_SECONDS = 2;

type FollowedPlace = {
  read: () => number;
  seek: (seconds: number) => void;
  stop: () => void;
};

/**
 * Keeps where a viewer is in a film, for starting it again there, from an element that cannot
 * always say.
 *
 * A place is taken from a picture playing or a seek, never from a reading of the very start,
 * because an element being reset reads that before anything says so. From the element refusing
 * what it was sent, or being emptied once it has had a picture, the place is held: Firefox has
 * emptied it already by the time it says so, and an engine starting it again seeks it to the start
 * and plays a moment there on its way. It lets go once a picture plays where it was held, which is
 * the element back where the viewer was, or once the element seeks somewhere past the first moments
 * of the film, since an engine starting the element again only ever seeks it to the start. A seek
 * somebody asked for is told to it directly, wherever it goes, since only the element's own seeks
 * are in doubt.
 *
 * @param element - The element playing the film.
 * @param startSeconds - Where the film was asked to begin, which is the place until it has one of
 *   its own.
 * @returns A reading of the place, a way to tell it of a seek somebody asked for, and a way to stop
 *   following it.
 */
const followPlace = (element: HTMLMediaElement, startSeconds: number): FollowedPlace => {
  const place = { atSeconds: startSeconds, hasPicture: false, isHeld: false };

  const noteWhereRefused = () => {
    if (!place.isHeld && element.currentTime > 0) {
      place.atSeconds = element.currentTime;
    }

    place.isHeld = true;
  };
  const holdWhereItWas = () => {
    if (place.hasPicture) {
      place.isHeld = true;
    }
  };
  const noteWhereItIs = () => {
    if (element.currentTime <= 0 || element.readyState < HAS_A_PICTURE) {
      return;
    }

    if (
      place.isHeld &&
      Math.abs(element.currentTime - place.atSeconds) > CAUGHT_UP_WITHIN_SECONDS
    ) {
      return;
    }

    place.isHeld = false;
    place.atSeconds = element.currentTime;
    place.hasPicture = true;
  };
  const noteWhereItGoes = () => {
    if (element.currentTime <= (place.isHeld ? CAUGHT_UP_WITHIN_SECONDS : 0)) {
      return;
    }

    place.isHeld = false;
    place.atSeconds = element.currentTime;
  };

  element.addEventListener('error', noteWhereRefused);
  element.addEventListener('emptied', holdWhereItWas);
  element.addEventListener('timeupdate', noteWhereItIs);
  element.addEventListener('seeking', noteWhereItGoes);

  return {
    read: () => place.atSeconds,
    seek: (seconds) => {
      place.isHeld = false;
      place.atSeconds = seconds;
    },
    stop: () => {
      element.removeEventListener('error', noteWhereRefused);
      element.removeEventListener('emptied', holdWhereItWas);
      element.removeEventListener('timeupdate', noteWhereItIs);
      element.removeEventListener('seeking', noteWhereItGoes);
    },
  };
};

export type { FollowedPlace };

export { followPlace };
