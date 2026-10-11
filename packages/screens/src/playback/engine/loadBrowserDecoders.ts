import { z } from 'zod';

const DECODERS_URL = '/decoders/valence-browser-decoders.wasm';

const ResultSchema = z.number();

type DecodedSound = { samples: Float32Array; channels: number; sampleRate: number };

type TrueHdDecoder = {
  push: (packet: Uint8Array) => DecodedSound;
  free: () => void;
};

type DecodedPictures = { frames: Uint8Array; count: number; width: number; height: number };

type Mpeg2Decoder = {
  decode: (stream: Uint8Array) => DecodedPictures;
  free: () => void;
};

type BrowserDecoders = { createTrueHd: () => TrueHdDecoder; createMpeg2: () => Mpeg2Decoder };

const loaded: { decoders: Promise<BrowserDecoders | null> | null } = { decoders: null };

/**
 * One of the module's exported functions, refusing anything that is not a function.
 *
 * @param exports - The module's exports.
 * @param name - The function's name.
 * @returns The function.
 */
const functionNamed = (exports: WebAssembly.Exports, name: string): CallableFunction => {
  const found = exports[name];

  if (typeof found !== 'function') {
    throw new Error(`The decoders have no ${name}.`);
  }

  return found;
};

/**
 * Calls one of the module's exported functions with numbers and reads back the number it returns.
 *
 * @param exports - The module's exports.
 * @param name - The function's name.
 * @returns A way to call it.
 */
const exported = (
  exports: WebAssembly.Exports,
  name: string,
): ((...numbers: number[]) => number) => {
  const found = functionNamed(exports, name);

  return (...numbers) => ResultSchema.parse(Reflect.apply(found, undefined, numbers));
};

/**
 * Calls one of the module's exported functions that returns nothing.
 *
 * @param exports - The module's exports.
 * @param name - The function's name.
 * @returns A way to call it.
 */
const exportedAction = (
  exports: WebAssembly.Exports,
  name: string,
): ((...numbers: number[]) => void) => {
  const found = functionNamed(exports, name);

  return (...numbers) => {
    Reflect.apply(found, undefined, numbers);
  };
};

/**
 * Loads Valence's own decoders for the codecs no browser decodes, built from Rust to WebAssembly
 * and served beside the page. Fetched once, when first needed; where the server was built without
 * them, the answer is nothing and those films go to the server as before.
 *
 * Each decoder copies packets into the module's memory and reads its samples back out, freeing
 * everything it borrowed, so nothing outlives the call that needed it.
 *
 * @returns The decoders, or nothing where they are not there.
 */
const loadBrowserDecoders = (): Promise<BrowserDecoders | null> => {
  loaded.decoders ??= (async (): Promise<BrowserDecoders | null> => {
    const response = await fetch(DECODERS_URL);

    if (!response.ok) {
      return null;
    }

    const { instance } = await WebAssembly.instantiate(await response.arrayBuffer());
    const { exports } = instance;
    const memory = exports.memory;

    if (!(memory instanceof WebAssembly.Memory)) {
      return null;
    }

    const bufferNew = exported(exports, 'buffer_new');
    const bufferFree = exportedAction(exports, 'buffer_free');
    const truehdNew = exported(exports, 'truehd_new');
    const truehdFree = exportedAction(exports, 'truehd_free');
    const truehdPush = exported(exports, 'truehd_push');
    const truehdSamples = exported(exports, 'truehd_samples');
    const truehdSampleCount = exported(exports, 'truehd_sample_count');
    const truehdTake = exportedAction(exports, 'truehd_take');
    const truehdChannels = exported(exports, 'truehd_channels');
    const truehdSampleRate = exported(exports, 'truehd_sample_rate');
    const mpeg2New = exported(exports, 'mpeg2_new');
    const mpeg2Free = exportedAction(exports, 'mpeg2_free');
    const mpeg2Decode = exported(exports, 'mpeg2_decode');
    const mpeg2Frames = exported(exports, 'mpeg2_frames');
    const mpeg2Width = exported(exports, 'mpeg2_width');
    const mpeg2Height = exported(exports, 'mpeg2_height');

    return {
      createMpeg2: (): Mpeg2Decoder => {
        const session = mpeg2New();

        return {
          decode: (stream: Uint8Array) => {
            const at = bufferNew(stream.length);

            new Uint8Array(memory.buffer, at, stream.length).set(stream);

            const count = mpeg2Decode(session, at, stream.length);

            bufferFree(at, stream.length);

            const width = mpeg2Width(session);
            const height = mpeg2Height(session);
            const length = count * width * height * 1.5;

            return {
              frames: new Uint8Array(memory.buffer, mpeg2Frames(session), length).slice(),
              count,
              width,
              height,
            };
          },
          free: () => {
            mpeg2Free(session);
          },
        };
      },

      createTrueHd: (): TrueHdDecoder => {
        const session = truehdNew();

        return {
          push: (packet: Uint8Array) => {
            const at = bufferNew(packet.length);

            new Uint8Array(memory.buffer, at, packet.length).set(packet);
            truehdPush(session, at, packet.length);
            bufferFree(at, packet.length);

            const count = truehdSampleCount(session);
            const samples = new Float32Array(count);

            samples.set(new Float32Array(memory.buffer, truehdSamples(session), count));
            truehdTake(session);

            return {
              samples,
              channels: truehdChannels(session),
              sampleRate: truehdSampleRate(session),
            };
          },
          free: () => {
            truehdFree(session);
          },
        };
      },
    };
  })().catch(() => null);

  return loaded.decoders;
};

export type { BrowserDecoders, DecodedPictures, DecodedSound, Mpeg2Decoder, TrueHdDecoder };

export { loadBrowserDecoders };
