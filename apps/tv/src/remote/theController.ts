type ControllerEars = {
  isHeard: () => boolean;
  hear: () => void;
  whenHeard: (listener: () => void) => () => void;
};

let made: ControllerEars | null = null;

/**
 * Whether a controller's buttons have reached the page yet, made the first time anything asks, for
 * what tells somebody how to let them: on an Xbox they steer Edge's own pointer until its game
 * controls are chosen. Hearing one tells whatever is listening, the first time only.
 *
 * @returns What has heard it.
 */
const theController = (): ControllerEars => {
  if (made !== null) {
    return made;
  }

  let isHeard = false;
  const listeners = new Set<() => void>();

  made = {
    isHeard: () => isHeard,
    hear: () => {
      if (isHeard) {
        return;
      }

      isHeard = true;

      for (const listener of listeners) {
        listener();
      }
    },
    whenHeard: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };

  return made;
};

export { theController };
