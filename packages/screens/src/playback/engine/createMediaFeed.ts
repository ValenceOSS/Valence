import {
  AudioSample,
  AudioSampleSource,
  Conversion,
  ConversionCanceledError,
  Mp4OutputFormat,
  Output,
  StreamTarget,
} from 'mediabunny';
import { chooseSoundRoute } from './chooseSoundRoute';
import { downmixToStereo } from './downmixToStereo';
import { readAacChannelOrder } from './readAacChannelOrder';
import { registerCodecExtensions } from './registerCodecExtensions';
import { loadBrowserDecoders } from './loadBrowserDecoders';
import type {
  EncodedPacketSink,
  Input,
  InputAudioTrack,
  InputVideoTrack,
  StreamTargetChunk,
} from 'mediabunny';
import type { SoundRoute } from './chooseSoundRoute';

const HELD_AHEAD_SECONDS = 30;

const KEPT_BEHIND_SECONDS = 30;

const LOOKS_AGAIN_MS = 500;

const FRAGMENT_SECONDS = 1;

const ENDS_EARLY_SECONDS = 5;

const SAMPLE_RATE = 48_000;

const MEASURED_FRAGMENTS = 3;

const LOSSLESS_TYPE = 'audio/mp4; codecs="flac"';

const SIXTEEN_BITS = 32_767;

const AAC_FROM_WAVE = [2, 0, 1, 4, 5, 3];

type MediaFeed = {
  sound: SoundRoute;
  bitrateAt: (seconds: number) => number | null;
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
 * The planes of a sound sample, one per channel, as 32-bit floats.
 *
 * @param sample - The sample.
 * @returns Its planes.
 */
const planesOf = (sample: AudioSample): Float32Array[] =>
  Array.from({ length: sample.numberOfChannels }, (_, planeIndex) => {
    const plane = new Float32Array(sample.numberOfFrames);

    sample.copyTo(plane, { planeIndex, format: 'f32-planar' });

    return plane;
  });

/**
 * A sound sample made from planes, closing the one it replaces.
 *
 * @param planes - The planes.
 * @param was - The sample it replaces, for its rate and time.
 * @returns The new sample.
 */
const sampleOf = (planes: readonly Float32Array[], was: AudioSample): AudioSample => {
  const frames = planes[0]?.length ?? 0;
  const data = new Float32Array(frames * planes.length);

  planes.forEach((plane, at) => {
    data.set(plane, at * frames);
  });

  const made = new AudioSample({
    data,
    format: 'f32-planar',
    numberOfChannels: planes.length,
    sampleRate: was.sampleRate,
    timestamp: was.timestamp,
  });

  was.close();

  return made;
};

/**
 * A 5.1 sample with its channels put into AAC's own order, centre first, for an encoder that reads
 * them so.
 *
 * @param sample - The sample, in the order WAVE and FFmpeg use.
 * @returns The sample in AAC's order.
 */
const inAacOrder = (sample: AudioSample): AudioSample => {
  const planes = planesOf(sample);

  return sampleOf(
    AAC_FROM_WAVE.map((from) => planes[from] ?? new Float32Array(sample.numberOfFrames)),
    sample,
  );
};

/**
 * A sound sample folded into stereo by Valence's own downmix, which keeps the centre channel the
 * dialogue is in.
 *
 * @param sample - The sample, in any number of channels.
 * @returns The sample in two.
 */
const stereoOf = (sample: AudioSample): AudioSample =>
  sample.numberOfChannels <= 2 ? sample : sampleOf(downmixToStereo(planesOf(sample)), sample);

/**
 * Plays a file through the media element by repackaging it here: the chosen sound track, and the
 * picture too where it is given one, are written into fragmented MP4 as they go and appended to the
 * element through Media Source Extensions. The picture is copied exactly as it was encoded, HDR and
 * Dolby Vision included, so the element shows it as it would show any file of its own. The sound is
 * copied where the element plays its codec, and decoded and encoded again otherwise: 5.1 stays 5.1
 * where this browser's AAC encoder takes it and the order it reads channels in is known, and
 * everything else is folded into stereo by Valence's own downmix, so the dialogue in the centre
 * channel is never lost or moved.
 *
 * It knows the size and start of every fragment it appends, so it can say the bitrate of what is
 * playing now — the file's own, where the picture is copied — at no cost.
 *
 * A sound no browser decodes, such as TrueHD, is decoded here by Valence's own WebAssembly decoder
 * and encoded as FLAC beside the picture's copy, since Mediabunny has no decoder of its own for it.
 *
 * Starting counts as done once the element holds media to play, not merely the file's header, so
 * nothing waiting on the element mistakes a slow first fragment for a stream that failed.
 *
 * A file the feed cannot read to the end, such as one with a stretch of it missing, is said as a
 * failure rather than ended where the reading stopped, and so is the element refusing what it was
 * given. The server reads past what Mediabunny cannot, so the film carries on there instead of
 * stopping part of the way in, or sitting still with nothing said.
 *
 * The feed keeps thirty seconds ahead of the element and thirty behind, waiting rather than reading
 * the whole film into memory. Seeking somewhere the element already holds needs nothing; seeking
 * anywhere else empties the element and starts again from the key frame before that point, placed
 * at the right time so the clock reads the film's own time throughout. An element whose memory is
 * full has what it already played dropped to make room, and where it has played nothing yet, as when
 * paused at the start of a high-bitrate film, the feed waits for it to move on rather than asking
 * again at once, which would hold the tab.
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
  decodesHere = null,
  soundPackets = null,
  onFault,
}: {
  element: HTMLVideoElement;
  input: Input;
  duration: number;
  track: Pick<InputAudioTrack, 'id' | 'codec' | 'getCodecParameterString' | 'getNumberOfChannels'>;
  picture?: Pick<InputVideoTrack, 'id' | 'getCodecParameterString'> | null;
  decodesHere?: 'truehd' | null;
  soundPackets?: Pick<EncodedPacketSink, 'getPacket' | 'getFirstPacket' | 'packets'> | null;
  onFault: () => void;
}): Promise<MediaFeed> => {
  const plays = (mimeType: string) => MediaSource.isTypeSupported(mimeType);

  await registerCodecExtensions();

  const decoders = decodesHere === null ? null : await loadBrowserDecoders();

  if (
    decodesHere !== null &&
    (decoders === null || soundPackets === null || !plays(LOSSLESS_TYPE))
  ) {
    throw new Error('This browser cannot decode that sound here.');
  }

  const sound: SoundRoute =
    decodesHere === null
      ? await chooseSoundRoute(track, plays, await readAacChannelOrder())
      : {
          kind: 'encoded',
          codec: 'flac',
          parameter: 'flac',
          numberOfChannels: 8,
          isReordered: false,
        };
  const pictureCodec = picture === null ? null : await picture.getCodecParameterString();
  const source = new MediaSource();
  const address = URL.createObjectURL(source);
  const opened = once(source, 'sourceopen');

  element.src = address;
  await opened;
  source.duration = duration;

  const buffer = source.addSourceBuffer(typeOf(pictureCodec, sound.parameter));
  const state: {
    run: number;
    cancel: (() => Promise<void>) | null;
    queue: Promise<void>;
    fragments: { at: number; bytes: number }[];
  } = {
    run: 0,
    cancel: null,
    queue: Promise.resolve(),
    fragments: [],
  };
  const onRefused = () => {
    onFault();
  };

  element.addEventListener('error', onRefused);

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

  const heldFrom = (): number => {
    const { buffered } = buffer;

    return buffered.length === 0 ? 0 : buffered.start(0);
  };

  const append = async (data: Uint8Array<ArrayBuffer>, run: number) => {
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

        if (run !== state.run) {
          throw new ConversionCanceledError();
        }

        const behind = element.currentTime - 1;

        if (behind > heldFrom()) {
          await remove(0, behind);
        } else {
          await new Promise((resolve) => setTimeout(resolve, LOOKS_AGAIN_MS));
        }
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
        onMoof: (data, _, timestamp) => {
          if (run === state.run) {
            state.fragments.push({ at: seconds + timestamp, bytes: data.length });
          }
        },
        onMdat: (data) => {
          const last = state.fragments.at(-1);

          if (run === state.run && last !== undefined) {
            last.bytes += data.length;
          }
        },
      }),
      target: new StreamTarget(
        new WritableStream<StreamTargetChunk>({
          write: async (chunk) => {
            if (run !== state.run) {
              throw new ConversionCanceledError();
            }

            await inTurn(() => append(chunk.data, run));

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
        candidate.id !== track.id || decodesHere !== null
          ? { discard: true }
          : sound.kind === 'carried'
            ? {}
            : {
                codec: sound.codec,
                ...(sound.codec === 'flac' ? {} : { sampleRate: SAMPLE_RATE }),
                forceTranscode: true,
                ...(sound.codec === 'flac'
                  ? { numberOfChannels: sound.numberOfChannels, sampleFormat: 's16' }
                  : sound.numberOfChannels === 2
                    ? { process: stereoOf, processedNumberOfChannels: 2 }
                    : sound.isReordered
                      ? { process: inAacOrder, processedNumberOfChannels: sound.numberOfChannels }
                      : { numberOfChannels: sound.numberOfChannels }),
              },
      trim: { start: seconds },
      copy: { boundaryPolicy: 'expand' },
      showWarnings: false,
      composable: decodesHere !== null,
    });

    if (run !== state.run) {
      return;
    }

    state.cancel = async () => {
      await conversion.cancel();

      if (decodesHere !== null) {
        await output.cancel();
      }
    };

    try {
      if (decodesHere !== null && decoders !== null && soundPackets !== null) {
        await feedDecodedSound(output, conversion, seconds, run);
      } else {
        await conversion.execute();
      }

      await inTurn(async () => {
        await settle();

        if (run !== state.run || source.readyState !== 'open') {
          return;
        }

        if (heldUntil() < duration - ENDS_EARLY_SECONDS) {
          throw new Error('The file stopped being readable before its end.');
        }

        source.endOfStream();
      });
    } catch (error) {
      if (run === state.run && !(error instanceof ConversionCanceledError)) {
        onFault();
      }
    } finally {
      firstAppended();
    }
  };

  const feedDecodedSound = async (
    output: Output,
    conversion: Conversion,
    seconds: number,
    run: number,
  ) => {
    if (decoders === null || soundPackets === null) {
      return;
    }

    const decoding = decoders.createTrueHd();
    const voice = new AudioSampleSource({ codec: 'flac' });

    output.addAudioTrack(voice);
    await output.start();

    const copyingPicture = conversion.execute();

    try {
      const first =
        (await soundPackets.getPacket(seconds)) ?? (await soundPackets.getFirstPacket());
      let clock: number | null = null;

      for await (const packet of first === null ? [] : soundPackets.packets(first)) {
        if (run !== state.run) {
          return;
        }

        const decoded = decoding.push(packet.data);
        const frames = decoded.channels === 0 ? 0 : decoded.samples.length / decoded.channels;

        if (frames === 0) {
          continue;
        }

        const lasts = frames / decoded.sampleRate;

        clock ??= packet.timestamp + packet.duration - lasts;

        if (clock + lasts > seconds) {
          const sample = new AudioSample({
            data: Int16Array.from(decoded.samples, (value) =>
              Math.round(Math.max(-1, Math.min(1, value)) * SIXTEEN_BITS),
            ),
            format: 's16',
            numberOfChannels: decoded.channels,
            sampleRate: decoded.sampleRate,
            timestamp: Math.max(0, clock - seconds),
          });

          try {
            await voice.add(sample);
          } finally {
            sample.close();
          }
        }

        clock += lasts;
      }

      voice.close();
      await copyingPicture;
      await output.finalize();
    } finally {
      decoding.free();
    }
  };

  const cancelRunning = async () => {
    state.run += 1;

    const running = state.cancel;

    state.cancel = null;
    await running?.().catch(() => undefined);
  };

  return {
    sound,

    bitrateAt: (seconds) => {
      const after = state.fragments.findIndex((fragment) => fragment.at > seconds);
      const until = after === -1 ? state.fragments.length : after;
      const counted = state.fragments.slice(Math.max(0, until - MEASURED_FRAGMENTS), until);
      const first = counted[0];
      const ends = state.fragments[until]?.at ?? null;

      if (first === undefined || ends === null || ends <= first.at) {
        return null;
      }

      return Math.round(
        (counted.reduce((sum, fragment) => sum + fragment.bytes, 0) * 8) / (ends - first.at) / 1000,
      );
    },

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
        state.fragments = [];
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
      element.removeEventListener('error', onRefused);
      await cancelRunning();
      element.removeAttribute('src');
      element.load();
      URL.revokeObjectURL(address);
    },
  };
};

export type { MediaFeed };

export { createMediaFeed };
