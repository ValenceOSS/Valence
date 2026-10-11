import {
  AudioSample,
  Conversion,
  ConversionCanceledError,
  Mp4OutputFormat,
  Output,
  StreamTarget,
} from 'mediabunny';
import { chooseSoundRoute } from './chooseSoundRoute';
import { downmixToStereo } from './downmixToStereo';
import type { Input, InputAudioTrack, InputVideoTrack, StreamTargetChunk } from 'mediabunny';
import type { SoundRoute } from './chooseSoundRoute';

const HELD_AHEAD_SECONDS = 30;

const KEPT_BEHIND_SECONDS = 30;

const LOOKS_AGAIN_MS = 500;

const FRAGMENT_SECONDS = 1;

const SAMPLE_RATE = 48_000;

type MediaFeed = {
  sound: SoundRoute;
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
 * The type a Media Source buffer is opened with for a picture and sound, or for sound alone.
 *
 * @param picture - The picture's codec string, where the picture goes too.
 * @param sound - The sound's codec string.
 * @returns The type.
 */
const typeOf = (picture: string | null, sound: string): string =>
  picture === null ? `audio/mp4; codecs="${sound}"` : `video/mp4; codecs="${picture}, ${sound}"`;

/**
 * A sound sample folded into stereo by Valence's own downmix, which keeps the centre channel the
 * dialogue is in.
 *
 * @param sample - The sample, in any number of channels.
 * @returns The sample in two.
 */
const stereoOf = (sample: AudioSample): AudioSample => {
  if (sample.numberOfChannels <= 2) {
    return sample;
  }

  const planes = Array.from({ length: sample.numberOfChannels }, (_, planeIndex) => {
    const plane = new Float32Array(sample.numberOfFrames);

    sample.copyTo(plane, { planeIndex, format: 'f32-planar' });

    return plane;
  });
  const [left, right] = downmixToStereo(planes);
  const data = new Float32Array(left.length * 2);

  data.set(left);
  data.set(right, left.length);

  const stereo = new AudioSample({
    data,
    format: 'f32-planar',
    numberOfChannels: 2,
    sampleRate: sample.sampleRate,
    timestamp: sample.timestamp,
  });

  sample.close();

  return stereo;
};

/**
 * Plays a file through the media element by repackaging it here: the chosen sound track, and the
 * picture too where it is given one, are written into fragmented MP4 as they go and appended to the
 * element through Media Source Extensions. The picture is copied exactly as it was encoded, HDR and
 * Dolby Vision included, so the element shows it as it would show any file of its own. The sound is
 * copied where the element plays its codec, and decoded and encoded again otherwise, keeping every
 * channel where this browser can encode that many and folded into stereo by Valence's own downmix
 * where it cannot, so the dialogue in the centre channel is never lost.
 *
 * Starting counts as done once the element holds media to play, not merely the file's header, so
 * nothing waiting on the element mistakes a slow first fragment for a stream that failed.
 *
 * The feed keeps thirty seconds ahead of the element and thirty behind, waiting rather than reading
 * the whole film into memory. Seeking somewhere the element already holds needs nothing; seeking
 * anywhere else empties the element and starts again from the key frame before that point, placed
 * at the right time so the clock reads the film's own time throughout.
 *
 * @param options - The element, the opened file, its length, the sound track, the picture where it
 *   goes too, and where to say a failure.
 * @returns The feed, once the element has been given its source.
 */
const createMediaFeed = async ({
  element,
  input,
  duration,
  track,
  picture = null,
  onFault,
}: {
  element: HTMLVideoElement;
  input: Input;
  duration: number;
  track: Pick<InputAudioTrack, 'id' | 'codec' | 'getCodecParameterString' | 'getNumberOfChannels'>;
  picture?: Pick<InputVideoTrack, 'id' | 'getCodecParameterString'> | null;
  onFault: () => void;
}): Promise<MediaFeed> => {
  const plays = (mimeType: string) => MediaSource.isTypeSupported(mimeType);
  const sound = await chooseSoundRoute(track, plays);
  const pictureCodec = picture === null ? null : await picture.getCodecParameterString();
  const source = new MediaSource();
  const address = URL.createObjectURL(source);
  const opened = once(source, 'sourceopen');

  if (sound.kind === 'encoded' && ['ac3', 'eac3'].includes(track.codec ?? '')) {
    const { registerAc3Decoder } = await import('@mediabunny/ac3');

    registerAc3Decoder();
  }

  element.src = address;
  await opened;
  source.duration = duration;

  const buffer = source.addSourceBuffer(typeOf(pictureCodec, sound.parameter));
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

            if (buffer.buffered.length > 0) {
              firstAppended();
            }

            await roomFor(run);
          },
        }),
      ),
    });
    const conversion = await Conversion.init({
      input,
      output,
      video: (candidate) => (candidate.id === picture?.id ? {} : { discard: true }),
      audio: (candidate) =>
        candidate.id !== track.id
          ? { discard: true }
          : sound.kind === 'carried'
            ? {}
            : {
                codec: sound.codec,
                sampleRate: SAMPLE_RATE,
                forceTranscode: true,
                ...(sound.numberOfChannels === 2
                  ? { process: stereoOf, processedNumberOfChannels: 2 }
                  : { numberOfChannels: sound.numberOfChannels }),
              },
      trim: { start: seconds },
      copy: { boundaryPolicy: 'expand' },
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
    sound,

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

export type { MediaFeed };

export { createMediaFeed };
