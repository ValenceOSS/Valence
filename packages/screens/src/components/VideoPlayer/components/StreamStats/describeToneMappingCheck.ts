import type { ToneMappingCheck } from '@ValenceClient/playback/ToneMappingCheck';
import { say } from '@ValenceI18n/say';

/**
 * Says how Valence's own tone mapping check went, for the stats: that it passed, or why the player
 * left HDR to the browser instead.
 *
 * @param check - How the check went.
 * @param codec - The film's picture codec, as Valence names it.
 * @returns What to show.
 */
const describeToneMappingCheck = (check: ToneMappingCheck, codec: string): string => {
  switch (check.outcome) {
    case 'trusted':
      return say('screens.videoPlayer.streamStats.toneMappingTrusted');
    case 'noWebGpu':
      return say('screens.videoPlayer.streamStats.toneMappingNoWebGpu');
    case 'notDecodable':
      return say('screens.videoPlayer.streamStats.toneMappingNotDecodable', { codec });
    case 'notDecoded':
      return say('screens.videoPlayer.streamStats.toneMappingNotDecoded');
    case 'changed':
      return say('screens.videoPlayer.streamStats.toneMappingChanged', {
        grey: check.grey.toString(),
      });
    case 'failed':
      return say('screens.videoPlayer.streamStats.toneMappingFailed', { reason: check.reason });
  }
};

export { describeToneMappingCheck };
