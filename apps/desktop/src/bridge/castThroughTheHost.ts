import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { CastingNowSchema } from '@ValenceContracts/schemas/CastingNow';
import type { CastingNow } from '@ValenceContracts/schemas/CastingNow';
import { CastPlayedSchema } from '@ValenceContracts/schemas/CastPlayed';
import type { Casting } from '@ValenceClient/platform/Platform.types';
import { hearTheHost } from '@ValenceDesktop/bridge/hearTheHost';
import { keepUpWith } from '@ValenceDesktop/bridge/keepUpWith';
import { tellTheHost } from '@ValenceDesktop/bridge/tellTheHost';

const NOTHING_YET: CastingNow = { state: 'unavailable', devices: [], device: null };

const AnswerSchema = z.boolean().catch(false);

const AddressSchema = z.string().min(1).nullable().catch(null);

/**
 * Casts through the host, which finds the Chromecasts on the network and speaks to the one chosen,
 * keeping up with what it says about them and asking it once how things stand, so that a device
 * heard before the page listened is not missed.
 *
 * @returns What the page casts with.
 */
const castThroughTheHost = (): Casting => {
  const kept = keepUpWith('valence:cast-changed', CastingNowSchema, NOTHING_YET);

  void invoke('cast_now')
    .then((said) => {
      const now = CastingNowSchema.safeParse(said);

      if (now.success) {
        kept.set(now.data);
      }
    })
    .catch(() => undefined);

  return {
    now: kept.now,
    whenChanged: kept.whenChanged,
    connect: async (deviceId) =>
      AnswerSchema.parse(await invoke('cast_connect', { deviceId }).catch(() => false)),
    disconnect: async () => {
      await invoke('cast_disconnect').catch(() => undefined);
    },
    load: async ({ address, contentType, title, startSeconds }) =>
      AnswerSchema.parse(
        await invoke('cast_load', { path: address, contentType, title, startSeconds }).catch(
          () => false,
        ),
      ),
    whenPlayed: (listener) => hearTheHost('valence:cast-played', CastPlayedSchema, listener),
    play: () => {
      tellTheHost('cast_play');
    },
    pause: () => {
      tellTheHost('cast_pause');
    },
    seek: (seconds) => {
      tellTheHost('cast_seek', { seconds });
    },
    setVolume: (level) => {
      tellTheHost('cast_volume', { level });
    },
    reachableAddress: async (path) =>
      AddressSchema.parse(await invoke('cast_address_of', { path }).catch(() => null)),
  };
};

export { castThroughTheHost };
