import { detectEngineSupport } from '@ValenceClient/playback/detectEngineSupport';
import type { EngineSupport } from '@ValenceClient/playback/EngineSupport';
import { checkToneMapping } from '@ValenceScreens/playback/engine/checkToneMapping';

const asked: { answer: Promise<EngineSupport> | null } = { answer: null };

/**
 * What this browser's own player can play, asked of the browser once and remembered for as long as
 * the page lives, since a decoder does not come or go while it is open.
 *
 * @returns The codecs it can play through its own player.
 */
const readEngineSupport = (): Promise<EngineSupport> => {
  asked.answer ??= detectEngineSupport({
    isSecureContext: window.isSecureContext,
    hasGpu: async () => 'gpu' in navigator && (await navigator.gpu.requestAdapter()) !== null,
    canDecodeVideo:
      typeof VideoDecoder === 'undefined'
        ? null
        : async (config) => (await VideoDecoder.isConfigSupported(config)).supported === true,
    canDecodeAudio:
      typeof AudioDecoder === 'undefined'
        ? null
        : async (config) => (await AudioDecoder.isConfigSupported(config)).supported === true,
    canEncodeAudio:
      typeof AudioEncoder === 'undefined'
        ? null
        : async (config) => (await AudioEncoder.isConfigSupported(config)).supported === true,
    canStream:
      typeof MediaSource === 'undefined'
        ? null
        : (mimeType) => MediaSource.isTypeSupported(mimeType),
    canToneMap: checkToneMapping,
  });

  return asked.answer;
};

export { readEngineSupport };
