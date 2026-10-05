import { stopWatching } from '@ValenceClient/playback/startPlaybackSession';

const holders = new Map<string, number>();

const turns = new Map<string, number>();

/**
 * Says a player on this device is showing something, until the release it returns is called. The
 * device is only told to have stopped watching once the last player lets go and none has taken its
 * place by the end of the moment. A player that closes as another opens — React mounting one twice
 * in development, an audio or quality change starting the stream again, one episode going on to the
 * next — would otherwise send its stop after the new player's start, end the viewing just begun,
 * and leave the server never hearing it finish. Only the last player to let go decides whether to
 * tell the server, and a player taking hold in the meantime calls it off.
 *
 * @param clientId - Which device.
 * @param shouldStop - Whether to tell the server at all when the time comes, such as not while offline.
 * @returns The release, which does nothing if called again.
 */
const holdWatching = (clientId: string, shouldStop: () => boolean = () => true): (() => void) => {
  let isReleased = false;

  holders.set(clientId, (holders.get(clientId) ?? 0) + 1);
  turns.set(clientId, (turns.get(clientId) ?? 0) + 1);

  return () => {
    if (isReleased) {
      return;
    }

    isReleased = true;

    const left = Math.max(0, (holders.get(clientId) ?? 1) - 1);

    holders.set(clientId, left);

    if (left > 0) {
      return;
    }

    const turn = (turns.get(clientId) ?? 0) + 1;

    turns.set(clientId, turn);
    setTimeout(() => {
      if (turns.get(clientId) === turn && shouldStop()) {
        void stopWatching(clientId);
      }
    }, 0);
  };
};

export { holdWatching };
