import { CAST_CONTENT_TYPE } from '@ValenceScreens/playback/castSender';
import type { Casting } from '@ValenceClient/platform/Platform.types';
import type { Caster } from './Caster.types';

/**
 * Casts through what the client offers in place of a browser's Cast SDK — the desktop app speaks to
 * the devices itself — with the list of devices drawn by the player, and the stream handed over as
 * a path on the server for the client to make whole.
 *
 * @param casting - What the client casts with.
 * @returns What the player casts with.
 */
const castThroughThePlatform = (casting: Casting): Caster => {
  let isPlaying = false;

  return {
    watch: (listener) =>
      casting.whenChanged((now) => {
        listener({ state: now.state, devices: now.devices, deviceId: now.device?.id ?? null });
      }),
    canReach: () => true,
    choose: () => undefined,
    castTo: (deviceId) => casting.connect(deviceId),
    stop: () => {
      void casting.disconnect();
    },
    load: ({ address, title, startSeconds }) =>
      casting.load({ address, contentType: CAST_CONTENT_TYPE, title, startSeconds }),
    follow: (onSeconds, onPlaying) =>
      casting.whenPlayed((played) => {
        isPlaying = played.isPlaying;
        onSeconds(played.seconds);
        onPlaying(played.isPlaying);
      }),
    playOrPause: () => {
      if (isPlaying) {
        casting.pause();

        return;
      }

      casting.play();
    },
    seek: (seconds) => {
      casting.seek(seconds);
    },
    setVolume: (level) => {
      casting.setVolume(level);
    },
    deviceName: () => casting.now().device?.name ?? null,
    reachableAddress: (address) => casting.reachableAddress(address),
  };
};

export { castThroughThePlatform };
