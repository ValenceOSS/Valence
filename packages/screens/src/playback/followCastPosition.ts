import type { CastCarrier } from './castSender.types';

/**
 * Follows where the device being cast to has got to, since the page's own element sits paused
 * while it plays. Only a position the device has media loaded at is said, so the moment a cast ends,
 * when the device reads nought, is not taken for the viewer going back to the beginning.
 *
 * @param onSeconds - Told each position the device reaches.
 * @param carrier - Where the Cast framework was loaded, for a test.
 * @returns How to stop following.
 */
const followCastPosition = (
  onSeconds: (seconds: number) => void,
  carrier: CastCarrier = window,
): (() => void) => {
  const framework = carrier.cast?.framework;
  const Player = framework?.RemotePlayer;
  const Controller = framework?.RemotePlayerController;
  const changed = framework?.RemotePlayerEventType?.CURRENT_TIME_CHANGED;

  if (Player === undefined || Controller === undefined || changed === undefined) {
    return () => undefined;
  }

  const player = new Player();
  const controller = new Controller(player);
  const said = () => {
    if (player.isConnected && player.isMediaLoaded && Number.isFinite(player.currentTime)) {
      onSeconds(player.currentTime);
    }
  };

  controller.addEventListener(changed, said);

  return () => {
    controller.removeEventListener(changed, said);
  };
};

export { followCastPosition };
