import {
  Conversion,
  ConversionCanceledError,
  Mp4OutputFormat,
  Output,
  StreamTarget,
} from 'mediabunny';
import type { Input, InputAudioTrack, StreamTargetChunk } from 'mediabunny';

const HELD_AHEAD_SECONDS = 30;

const KEPT_BEHIND_SECONDS = 30;

const LOOKS_AGAIN_MS = 500;

const FRAGMENT_SECONDS = 2;

const RE_ENCODED_AS = 'audio/mp4; codecs="opus"';

type SoundFeed = {
  isCarried: boolean;
  startAt: (seconds: number) => Promise<void>;
  holds: (seconds: number) => boolean;
  stop: () => Promise<void>;
};

/**
 * Waits for an event once.
 *
 * @param target - What sends it.
 * @param name - The event.
 * @returns When it has been sent.
 */
const once = (target: EventTarget, name: string): Promise<void> =>
  new Promise((resolve) => {
    target.addEventListener(name, () => resolve(), { once: true });
  });

/**
 * Plays a file's sound through the media element, which stays the clock everything else follows:
 * the chosen track is repackaged into fragmented MP4 as it goes and appended to the element through
 * Media Source Extensions, as it is where the element plays that codec, and decoded and encoded
 * again as stereo Opus where it does not.
 *
 * The feed keeps thirty seconds ahead of the element and thirty behind, waiting rather than reading
 * the whole film into memory. Seeking somewhere the element already holds needs nothing; seeking
 * anywhere else empties the element and starts the sound again from there, placed at the right time
 * so the clock reads the film's own time throughout.
 *
 * @param options - The element, the opened file, its length, the track to play, and where to say a
 *   failure.
 * @returns The feed, once the element has been given its source.
 */
const createSoundFeed = async ({
  element,
  input,
  duration,
  track,
  onFault,
}: {
  element: HTMLVideoElement;
  input: Input;
  duration: number;
  track: Pick<InputAudioTrack, 'id' | 'codec' | 'getCodecParameterString'>;
  onFault: () => void;
}): Promise<SoundFeed> => {
  const ownCodec = await track.getCodecParameterString();
  const ownType = ownCodec === null ? null : `audio/mp4; codecs="${ownCodec}"`;
  const carriedType = ownType !== null && MediaSource.isTypeSupported(ownType) ? ownType : null;
  const isCarried = carriedType !== null;
  const source = new MediaSource();
  const address = URL.createObjectURL(source);
  const opened = once(source, 'sourceopen');

  if (!isCarried && ['ac3', 'eac3'].includes(track.codec ?? '')) {
    const { registerAc3Decoder } = await import('@mediabunny/ac3');

    registerAc3Decoder();
  }

  element.src = address;
  await opened;
  source.duration = duration;

  const buffer = source.addSourceBuffer(carriedType ?? RE_ENCODED_AS);
  const state: { run: number; conversion: Conversion | null; queue: Promise<void> } = {
    run: 0,
    conversion: null,
    queue: Promise.resolve(),
  };

  const inTurn = (work: () => Promise<void>): Promise<void> => {
    const next = state.queue.then(work);

    state.queue = next.catch(() => undefined);

    return next;
  };

  const settle = async () => {
    if (buffer.updating) {
      await once(buffer, 'updateend');
    }
  };

  const remove = async (from: number, until: number) => {
    if (until > from && source.readyState !== 'closed') {
      await settle();
      buffer.remove(from, until);
      await once(buffer, 'updateend');
    }
  };

  const heldUntil = (): number => {
    const { buffered } = buffer;

    return buffered.length === 0 ? 0 : buffered.end(buffered.length - 1);
  };

  const append = async (data: Uint8Array<ArrayBuffer>) => {
    for (;;) {
      try {
        await settle();
        buffer.appendBuffer(data);
        await once(buffer, 'updateend');

        return;
      } catch (error) {
        if (!(error instanceof DOMException) || error.name !== 'QuotaExceededError') {
          throw error;
        }

        await remove(0, element.currentTime - 1);
      }
    }
  };

  const roomFor = async (run: number) => {
    while (run === state.run && heldUntil() - element.currentTime > HELD_AHEAD_SECONDS) {
      await new Promise((resolve) => setTimeout(resolve, LOOKS_AGAIN_MS));
    }

    if (element.currentTime > KEPT_BEHIND_SECONDS * 2) {
      await inTurn(() => remove(0, element.currentTime - KEPT_BEHIND_SECONDS));
    }
  };

  const feedFrom = async (seconds: number, run: number, firstAppended: () => void) => {
    const output = new Output({
      format: new Mp4OutputFormat({
        fastStart: 'fragmented',
        minimumFragmentDuration: FRAGMENT_SECONDS,
      }),
      target: new StreamTarget(
        new WritableStream<StreamTargetChunk>({
          write: async (chunk) => {
            if (run !== state.run) {
              throw new ConversionCanceledError();
            }

            await inTurn(() => append(chunk.data));
            firstAppended();
            await roomFor(run);
          },
        }),
      ),
    });
    const conversion = await Conversion.init({
      input,
      output,
      video: { discard: true },
      audio: (candidate) =>
        candidate.id !== track.id
          ? { discard: true }
          : isCarried
            ? {}
            : { codec: 'opus', numberOfChannels: 2, sampleRate: 48_000, forceTranscode: true },
      trim: { start: seconds },
      showWarnings: false,
    });

    if (run !== state.run) {
      return;
    }

    state.conversion = conversion;

    try {
      await conversion.execute();
      await inTurn(async () => {
        await settle();

        if (run === state.run && source.readyState === 'open') {
          source.endOfStream();
        }
      });
    } catch (error) {
      if (run === state.run && !(error instanceof ConversionCanceledError)) {
        onFault();
      }
    } finally {
      firstAppended();
    }
  };

  const cancelRunning = async () => {
    state.run += 1;

    const running = state.conversion;

    state.conversion = null;
    await running?.cancel().catch(() => undefined);
  };

  return {
    isCarried,

    startAt: async (seconds) => {
      await cancelRunning();

      const run = state.run;
      const from = Math.max(0, seconds);

      await inTurn(async () => {
        await settle();

        if (source.readyState === 'open') {
          buffer.abort();
        }

        await remove(0, Number.POSITIVE_INFINITY);
        buffer.timestampOffset = from;
      });

      await new Promise<void>((resolve) => {
        void feedFrom(from, run, resolve);
      });
    },

    holds: (seconds) => {
      const { buffered } = buffer;

      for (let at = 0; at < buffered.length; at += 1) {
        if (buffered.start(at) <= seconds && seconds < buffered.end(at)) {
          return true;
        }
      }

      return false;
    },

    stop: async () => {
      await cancelRunning();
      element.removeAttribute('src');
      element.load();
      URL.revokeObjectURL(address);
    },
  };
};

export type { SoundFeed };

export { createSoundFeed };
