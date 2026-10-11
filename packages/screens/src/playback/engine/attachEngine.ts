import { ALL_FORMATS, EncodedPacketSink, Input, UrlSource, VideoSampleSink } from 'mediabunny';
import { createBitrateMeter } from './createBitrateMeter';
import { createFrameQueue } from './createFrameQueue';
import { createHdrFrameSource } from './createHdrFrameSource';
import { loadBrowserDecoders } from './loadBrowserDecoders';
import { createMpeg2FrameSource } from './mpeg2/createMpeg2FrameSource';
import { createMpeg2Worker } from './mpeg2/createMpeg2Worker';
import { isMpeg2Track } from './mpeg2/isMpeg2Track';
import { createPicturePresenter } from './createPicturePresenter';
import { createMediaFeed } from './createMediaFeed';
import { soundDecodedHere } from './soundDecodedHere';
import { createThroughputMeter } from './createThroughputMeter';
import type { DeliveredFormat } from '@ValenceScreens/playback/attachShaka';
import type { EngineStats } from './EngineStats';

const NEAR_THE_END_SECONDS = 0.25;

const STILL_DECODING_SECONDS = 1;

const ASSUMED_PEAK_NITS = 1000;

const HELD_AHEAD_DECODED_HERE = 30;

type Drawable = {
  timestamp: number;
  close: () => void;
  present: (draw: (frame: VideoFrame) => void) => void;
};

type EngineOptions = {
  element: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  url: string;
  startSeconds: number;
  audioTrackAt: number;
  onFault: () => void;
};

/**
 * Plays a file this browser cannot play by itself, without the server converting it: the file is
 * read in pieces over HTTP, its picture decoded by WebCodecs and drawn on a canvas through WebGPU,
 * and its sound handed to the media element underneath, which stays the clock — so the controls,
 * seeking, volume and the events everything else listens for work exactly as they do for a file the
 * element plays itself.
 *
 * The sound is read through a file of its own, so that running thirty seconds ahead never evicts
 * from the cache the pieces the picture is about to need — at a 4K film's bitrate the two would
 * otherwise take turns waiting on the network.
 *
 * MPEG-2, which no browser decodes, is decoded by Valence's own WebAssembly decoder instead.
 *
 * Each animation frame draws the newest decoded frame at or before the element's time, whether it
 * is playing, paused or being scrubbed. A seek the decoder is already ahead of costs nothing; any
 * other starts decoding again from there, and the sound starts again too where the element does not
 * already hold that moment. The element is given the picture's shape, since it has no picture of
 * its own to take it from.
 *
 * Anything that fails — the file, a decoder, the GPU — is said once through `onFault`, for the
 * player to hand the film to the server instead.
 *
 * @param options - The element and canvas, the file, where to start, which sound track (counted
 *   from the first in the file), and where to say a failure.
 * @returns A handle carrying the teardown to call, how fast the connection is delivering the film,
 *   and readings of what is being played and how the
 *   player is keeping up, for the stats.
 */
const attachEngine = async ({
  element,
  canvas,
  url,
  startSeconds,
  audioTrackAt,
  onFault,
}: EngineOptions): Promise<{
  detach: () => Promise<void>;
  readDelivered: () => DeliveredFormat;
  readEngine: () => EngineStats;
  readEstimatedKbps: () => number | null;
}> => {
  const life: { isOver: boolean; hasFailed: boolean; drawing: number | null; drawn: number } = {
    isOver: false,
    hasFailed: false,
    drawing: null,
    drawn: 0,
  };
  const fail = () => {
    if (!life.isOver && !life.hasFailed) {
      life.hasFailed = true;
      onFault();
    }
  };
  const throughput = createThroughputMeter();
  const input = new Input({
    source: new UrlSource(url, {
      requestInit: { credentials: 'same-origin' },
      fetchFn: throughput.fetchFn,
    }),
    formats: ALL_FORMATS,
  });
  const [video, audioTracks, duration] = await Promise.all([
    input.getPrimaryVideoTrack(),
    input.getAudioTracks(),
    input.computeDuration(),
  ]);
  const audio = audioTracks[audioTrackAt] ?? audioTracks[0] ?? null;

  const isMpeg2 = video !== null && (await isMpeg2Track(video));
  const decoders = isMpeg2 ? await loadBrowserDecoders() : null;

  if (
    video === null ||
    audio === null ||
    (isMpeg2 ? decoders === null : !(await video.canDecode()))
  ) {
    input.dispose();

    throw new Error('The file has no picture and sound this browser can decode.');
  }

  const presenter = await createPicturePresenter(canvas, fail);

  if (presenter === null) {
    input.dispose();

    throw new Error('This browser has no WebGPU to draw with.');
  }

  const quarterTurns = Math.round((await video.getRotation()) / 90);
  const isSideways = quarterTurns % 2 === 1;
  const shape = isSideways
    ? { width: video.squarePixelHeight, height: video.squarePixelWidth }
    : { width: video.squarePixelWidth, height: video.squarePixelHeight };
  const frameRate =
    (await video.computePacketStats(100).catch(() => null))?.averagePacketRate ?? null;
  const [decoder, container, channels, sampleRate] = await Promise.all([
    video.getCodecParameterString(),
    input.getMimeType(),
    audio.getNumberOfChannels(),
    audio.getSampleRate(),
  ]);
  const hdr = isMpeg2 ? null : await createHdrFrameSource(video, new EncodedPacketSink(video));
  const containerColour = await video.getColorSpace();
  const mpeg2Worker = decoders === null ? null : createMpeg2Worker();
  const mpeg2 =
    mpeg2Worker === null
      ? null
      : createMpeg2FrameSource(new EncodedPacketSink(video), mpeg2Worker, {
          primaries:
            containerColour.primaries ?? (video.squarePixelHeight > 576 ? 'bt709' : 'smpte170m'),
          transfer: containerColour.transfer ?? 'bt709',
          matrix: containerColour.matrix ?? (video.squarePixelHeight > 576 ? 'bt709' : 'smpte170m'),
          fullRange: containerColour.fullRange ?? false,
        });
  const frames = createFrameQueue<Drawable>(
    {
      samples: async function* (from) {
        const decodedHere = hdr ?? mpeg2;

        if (decodedHere !== null) {
          for await (const decoded of decodedHere.samples(from)) {
            yield {
              timestamp: decoded.timestamp,
              close: decoded.close,
              present: (draw) => {
                draw(decoded.frame);
              },
            };
          }

          return;
        }

        for await (const sample of new VideoSampleSink(video).samples(from)) {
          yield {
            timestamp: sample.timestamp,
            close: () => {
              sample.close();
            },
            present: (draw) => {
              const frame = sample.toVideoFrame();

              try {
                draw(frame);
              } finally {
                frame.close();
              }
            },
          };
        }
      },
    },
    fail,
    mpeg2 === null ? undefined : HELD_AHEAD_DECODED_HERE,
  );

  presenter.grade(
    hdr === null
      ? { signal: 'sdr', isWideGamut: false, sourcePeakNits: ASSUMED_PEAK_NITS, quarterTurns }
      : {
          signal: hdr.signal,
          isWideGamut: hdr.isWideGamut,
          sourcePeakNits: hdr.peakNits ?? ASSUMED_PEAK_NITS,
          quarterTurns,
        },
  );
  const soundInput = new Input({
    source: new UrlSource(url, {
      requestInit: { credentials: 'same-origin' },
      fetchFn: throughput.fetchFn,
    }),
    formats: ALL_FORMATS,
  });
  const soundTracks = await soundInput.getAudioTracks();
  const soundTrack = soundTracks[audioTracks.indexOf(audio)] ?? audio;
  const feed = await createMediaFeed({
    element,
    input: soundInput,
    duration,
    track: soundTrack,
    decodesHere: await soundDecodedHere(soundTrack),
    soundPackets: new EncodedPacketSink(soundTrack),
    onFault: fail,
  });
  const shown: { sample: Drawable | null } = { sample: null };

  const show = (sample: Drawable) => {
    sample.present((frame) => {
      presenter.show(frame, shape);
    });
  };

  const draw = () => {
    if (life.isOver) {
      return;
    }

    const next = frames.take(element.currentTime);

    if (next !== null) {
      shown.sample?.close();
      shown.sample = next;
      life.drawn += 1;
      show(next);
    }

    life.drawing = requestAnimationFrame(draw);
  };

  const redraw = new ResizeObserver(() => {
    if (shown.sample !== null) {
      show(shown.sample);
    }
  });

  const onSeeking = () => {
    const at = element.currentTime;
    const reaches = frames.reaches();
    const isAhead =
      shown.sample !== null &&
      at >= shown.sample.timestamp &&
      at <= (reaches ?? shown.sample.timestamp) + STILL_DECODING_SECONDS;

    if (!isAhead) {
      frames.startAt(at);
    }

    if (!feed.holds(at) && at < duration - NEAR_THE_END_SECONDS) {
      void feed.startAt(at).catch(() => {
        fail();
      });
    }
  };

  const meter = createBitrateMeter([new EncodedPacketSink(video)], () => element.currentTime);

  element.style.aspectRatio = `${shape.width.toString()} / ${shape.height.toString()}`;
  frames.startAt(startSeconds);
  await feed.startAt(startSeconds);
  element.currentTime = startSeconds;
  element.addEventListener('seeking', onSeeking);
  redraw.observe(canvas);
  life.drawing = requestAnimationFrame(draw);

  return {
    readDelivered: () => ({
      videoCodec: decoder,
      audioCodec: feed.sound.parameter,
      mimeType: container,
      width: shape.width,
      height: shape.height,
      frameRate,
      bitrateKbps: (() => {
        const picture = meter.read();

        return picture === null ? null : picture + (feed.bitrateAt(element.currentTime) ?? 0);
      })(),
      audioSampleRate: feed.sound.kind === 'carried' ? sampleRate : 48_000,
      audioChannels: feed.sound.kind === 'carried' ? channels : feed.sound.numberOfChannels,
    }),

    readEstimatedKbps: throughput.readKbps,

    readEngine: () => {
      const counted = frames.counts();
      const reaches = frames.reaches();

      return {
        route: 'webgpu',
        gpu: presenter.gpu,
        hdrSignal: hdr?.signal ?? null,
        isHdrFilm: hdr !== null,
        container,
        sound: feed.sound.kind === 'carried' ? 'carried' : feed.sound.codec,
        soundChannels: feed.sound.kind === 'carried' ? channels : feed.sound.numberOfChannels,
        decodedFrames: counted.decoded,
        drawnFrames: life.drawn,
        skippedFrames: counted.skipped,
        decodedAheadSeconds: reaches === null ? null : Math.max(0, reaches - element.currentTime),
      };
    },

    detach: async () => {
      life.isOver = true;

      if (life.drawing !== null) {
        cancelAnimationFrame(life.drawing);
      }

      element.removeEventListener('seeking', onSeeking);
      redraw.disconnect();
      meter.stop();
      frames.stop();
      shown.sample?.close();
      shown.sample = null;
      await feed.stop();
      presenter.destroy();
      mpeg2Worker?.stop();
      input.dispose();
      soundInput.dispose();
      element.style.aspectRatio = '';
    },
  };
};

export { attachEngine };
