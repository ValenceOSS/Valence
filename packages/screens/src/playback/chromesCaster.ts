import { castStateOf, castStream } from '@ValenceScreens/playback/castSender';
import { absoluteStreamUrl, isReachableOrigin } from '@ValenceScreens/playback/castPlayback';
import { followCastPosition } from '@ValenceScreens/playback/followCastPosition';
import type { Caster } from './Caster.types';
import type {
  CastCarrier,
  CastContext,
  CastRemotePlayer,
  CastRemotePlayerController,
} from './castSender.types';

/**
 * Casts through Chrome's Cast SDK, which draws its own list of devices and is driven through its
 * remote player.
 *
 * @param context - The Cast context the SDK handed back.
 * @param carrier - Where the SDK was loaded, for a test.
 * @param origin - The address this page was served from.
 * @returns What the player casts with.
 */
const chromesCaster = (
  context: CastContext,
  carrier: CastCarrier = window,
  origin: () => string = () => window.location.origin,
): Caster => {
  let remote: { player: CastRemotePlayer; controller: CastRemotePlayerController } | null = null;

  const theRemote = () => {
    const framework = carrier.cast?.framework;
    const Player = framework?.RemotePlayer;
    const Controller = framework?.RemotePlayerController;

    if (remote === null && Player !== undefined && Controller !== undefined) {
      const player = new Player();

      remote = { player, controller: new Controller(player) };
    }

    return remote;
  };

  return {
    watch: (listener) => {
      const changed = carrier.cast?.framework.CastContextEventType.CAST_STATE_CHANGED;
      const said = () => {
        const state = castStateOf(context);

        listener({
          state:
            state === 'CONNECTED'
              ? 'connected'
              : state === 'CONNECTING'
                ? 'connecting'
                : 'available',
          devices: null,
          deviceId: null,
        });
      };

      if (changed !== undefined) {
        context.addEventListener(changed, said);
      }

      said();

      return () => {
        if (changed !== undefined) {
          context.removeEventListener(changed, said);
        }
      };
    },
    canReach: isReachableOrigin,
    choose: () => {
      void context.requestSession().catch(() => {});
    },
    castTo: () => Promise.resolve(false),
    stop: () => {
      context.getCurrentSession()?.endSession(true);
    },
    load: async ({ address, title, startSeconds }) => {
      const url = absoluteStreamUrl(address, origin());

      return url === null ? false : castStream(context, { url, title, startSeconds });
    },
    follow: (onSeconds, onPlaying) => followCastPosition(onSeconds, carrier, onPlaying),
    playOrPause: () => {
      theRemote()?.controller.playOrPause?.();
    },
    seek: (seconds) => {
      const held = theRemote();

      if (held !== null) {
        held.player.currentTime = seconds;
        held.controller.seek?.();
      }
    },
    setVolume: (level) => {
      const held = theRemote();

      if (held !== null) {
        held.player.volumeLevel = level;
        held.controller.setVolumeLevel?.();
      }
    },
    deviceName: () => context.getCurrentSession()?.getCastDevice()?.friendlyName ?? null,
    reachableAddress: (address) => Promise.resolve(absoluteStreamUrl(address, origin())),
  };
};

export { chromesCaster };
