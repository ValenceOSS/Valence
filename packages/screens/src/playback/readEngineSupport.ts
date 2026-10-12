import { detectEngineSupport } from '@ValenceClient/playback/detectEngineSupport';
import type { EngineSupport } from '@ValenceClient/playback/EngineSupport';
import { checkToneMapping } from '@ValenceScreens/playback/engine/checkToneMapping';
import { loadBrowserDecoders } from '@ValenceScreens/playback/engine/loadBrowserDecoders';

const asked: { answer: Promise<EngineSupport> | null } = { answer: null };

const EMPTY_MODULE = Uint8Array.of(0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00);

/**
 * Whether this page may compile WebAssembly, which a content security policy without
 * `'wasm-unsafe-eval'` forbids even where the browser supports it.
 *
 * @returns Whether a module compiles.
 */
const canRunWebAssembly = (): boolean => {
  try {
    return new WebAssembly.Module(EMPTY_MODULE) instanceof WebAssembly.Module;
  } catch {
    return false;
  }
};

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
    hasDecoders: async () => (await loadBrowserDecoders()) !== null,
    canRunWebAssembly,
  });

  return asked.answer;
};

export { readEngineSupport };
