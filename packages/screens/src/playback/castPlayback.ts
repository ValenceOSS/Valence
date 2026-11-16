import type { CastState, PlaybackTarget } from './castPlayback.types';

const OWN_NAMES = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];

/**
 * Decides whether a device elsewhere on the network could actually fetch from this address — a
 * television cannot reach `localhost`, and offering to cast from an address only this machine can
 * resolve produces a device that sits there loading for ever.
 *
 * @param origin - The address this page was served from.
 * @returns Whether something else on the network could reach it.
 */
const isReachableOrigin = (origin: string): boolean => {
  try {
    return !OWN_NAMES.includes(new URL(origin).hostname);
  } catch {
    return false;
  }
};

/**
 * Rewrites a stream address as something else on the network would have to ask for it, since a
 * relative address means nothing to a television.
 *
 * @param url - The stream's path on this server.
 * @param origin - The address this server is reachable at.
 * @returns The absolute address to hand the device.
 */
const absoluteStreamUrl = (url: string, origin: string): string | null => {
  if (!isReachableOrigin(origin)) {
    return null;
  }

  try {
    return new URL(url, origin).toString();
  } catch {
    return null;
  }
};

/**
 * Watches the devices the browser itself can play this video on — AirPlay in Safari and in a web
 * view built on WebKit, the Remote Playback API elsewhere — saying whether the browser reports one
 * there, and whether playback is going to one or has moved to one.
 *
 * @param element - The video being played, which is what carries the availability of a device to
 *   play it on.
 * @param onChange - Told whatever the browser reports.
 * @returns The function that stops watching.
 */
const watchPlaybackTargets = (
  element: HTMLVideoElement,
  onChange: (target: PlaybackTarget) => void,
): (() => void) => {
  const stops: (() => void)[] = [];

  if (typeof element.webkitShowPlaybackTargetPicker === 'function') {
    let isAvailable = false;

    const look = () => {
      const isWireless = element.webkitCurrentPlaybackTargetIsWireless === true;

      onChange({
        isAvailable: isAvailable || isWireless,
        state: isWireless ? 'connected' : 'idle',
      });
    };

    const onAvailability = (event: Event) => {
      isAvailable = 'availability' in event && event.availability === 'available';
      look();
    };

    element.addEventListener('webkitplaybacktargetavailabilitychanged', onAvailability);
    element.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', look);

    stops.push(() => {
      element.removeEventListener('webkitplaybacktargetavailabilitychanged', onAvailability);
      element.removeEventListener('webkitcurrentplaybacktargetiswirelesschanged', look);
    });
  }

  const remote = element.remote;

  // oxlint-disable-next-line typescript/no-unnecessary-condition -- TypeScript's description of the DOM says every video element has this. Safari's has not, and asking a browser what it can actually do beats believing a type.
  if (remote !== undefined) {
    let isAvailable = false;
    let state: PlaybackTarget['state'] = 'idle';

    const tell = () => {
      onChange({ isAvailable: isAvailable || state !== 'idle', state });
    };
    const said = (to: string) => {
      state = to === 'connected' ? 'connected' : to === 'connecting' ? 'connecting' : 'idle';
      tell();
    };

    const onConnecting = () => {
      said('connecting');
    };
    const onConnect = () => {
      said('connected');
    };
    const onDisconnect = () => {
      said('disconnected');
    };

    remote.addEventListener('connecting', onConnecting);
    remote.addEventListener('connect', onConnect);
    remote.addEventListener('disconnect', onDisconnect);

    void remote
      .watchAvailability((available) => {
        isAvailable = available;
        tell();
      })
      .then((watch) => {
        stops.push(() => {
          void remote.cancelWatchAvailability(watch);
        });
      })
      .catch(() => {});

    said(remote.state);

    stops.push(() => {
      remote.removeEventListener('connecting', onConnecting);
      remote.removeEventListener('connect', onConnect);
      remote.removeEventListener('disconnect', onDisconnect);
    });
  }

  return () => {
    for (const stop of stops) {
      stop();
    }
  };
};

/**
 * Watches for devices appearing and disappearing on the network, and for playback having moved to
 * one, so the button that offers to cast knows whether there is anywhere to cast to. A browser that
 * can cast at all is taken to have somewhere to cast to, since some say none until asked.
 *
 * @param element - The video being played, which on Safari is what carries the availability of a
 *   device to play it on.
 * @param onChange - Told whenever the state changes.
 * @returns The function that stops watching.
 */
const watchCastState = (
  element: HTMLVideoElement,
  onChange: (state: CastState) => void,
): (() => void) =>
  watchPlaybackTargets(element, ({ state }) => {
    onChange(state === 'idle' ? 'available' : state);
  });

/**
 * Reads what the browser reports about its own devices strictly, offering one only where the
 * browser says there is one, for a client with devices of its own to offer beside them.
 *
 * @param target - What the browser reports.
 * @returns Where casting through the browser stands.
 */
const castStateOfTarget = ({ isAvailable, state }: PlaybackTarget): CastState =>
  state !== 'idle' ? state : isAvailable ? 'available' : 'unavailable';

type PromptOutcome = 'shown' | 'dismissed' | 'refused' | 'unsupported';

/**
 * Asks the browser to show its own list of devices, since choosing one is something only the browser
 * may put on screen.
 *
 * @param element - The cast context to prompt through.
 * @returns The device chosen, or null where nobody chose one.
 */
const promptForDevice = async (element: HTMLVideoElement): Promise<PromptOutcome> => {
  if (typeof element.webkitShowPlaybackTargetPicker === 'function') {
    try {
      element.webkitShowPlaybackTargetPicker();

      return 'shown';
    } catch {
      return 'refused';
    }
  }

  const remote = element.remote;

  // oxlint-disable-next-line typescript/no-unnecessary-condition -- As above: the type is a promise the browser has not necessarily kept.
  if (remote === undefined) {
    return 'unsupported';
  }

  try {
    await remote.prompt();

    return 'shown';
  } catch (error) {
    const named = error instanceof Error ? error.name : '';

    return named === 'AbortError' || named === 'NotAllowedError' ? 'dismissed' : 'refused';
  }
};

export {
  isReachableOrigin,
  absoluteStreamUrl,
  watchPlaybackTargets,
  watchCastState,
  castStateOfTarget,
  promptForDevice,
};
