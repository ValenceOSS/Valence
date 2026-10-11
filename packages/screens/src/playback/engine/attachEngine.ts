import { ALL_FORMATS, Input, UrlSource, VideoSampleSink } from 'mediabunny';
import { createFrameQueue } from './createFrameQueue';
import { createPicturePresenter } from './createPicturePresenter';
import { createSoundFeed } from './createSoundFeed';
import type { VideoSample } from 'mediabunny';
import type { DeliveredFormat } from '@ValenceScreens/playback/attachShaka';
import type { EngineStats } from './EngineStats';

const STILL_DECODING_SECONDS = 1;

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
 * @returns A handle carrying the teardown to call, and readings of what is being played and how the
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
  const input = new Input({
    source: new UrlSource(url, { requestInit: { credentials: 'same-origin' } }),
    formats: ALL_FORMATS,
  });
  const [video, audioTracks, duration] = await Promise.all([
    input.getPrimaryVideoTrack(),
    input.getAudioTracks(),
    input.computeDuration(),
  ]);
  const audio = audioTracks[audioTrackAt] ?? audioTracks[0] ?? null;

  if (video === null || audio === null || !(await video.canDecode())) {
    input.dispose();

    throw new Error('The file has no picture and sound this browser can decode.');
  }

  const presenter = await createPicturePresenter(canvas, fail);

  if (presenter === null) {
    input.dispose();

    throw new Error('This browser has no WebGPU to draw with.');
  }

  const shape = { width: video.squarePixelWidth, height: video.squarePixelHeight };
  const [decoder, container, channels, sampleRate] = await Promise.all([
    video.getCodecParameterString(),
    input.getMimeType(),
    audio.getNumberOfChannels(),
    audio.getSampleRate(),
  ]);
  const frames = createFrameQueue(new VideoSampleSink(video), fail);
  const sound = await createSoundFeed({ element, input, duration, track: audio, onFault: fail });
  const shown: { sample: VideoSample | null } = { sample: null };

  const show = (sample: VideoSample) => {
    const frame = sample.toVideoFrame();

    try {
      presenter.show(frame, shape);
    } finally {
      frame.close();
    }
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

    if (!sound.holds(at)) {
      void sound.startAt(at).catch(() => {
        fail();
      });
    }
  };

  element.style.aspectRatio = `${shape.width.toString()} / ${shape.height.toString()}`;
  frames.startAt(startSeconds);
  await sound.startAt(startSeconds);
  element.currentTime = startSeconds;
  element.addEventListener('seeking', onSeeking);
  redraw.observe(canvas);
  life.drawing = requestAnimationFrame(draw);

  return {
    readDelivered: () => ({
      videoCodec: decoder,
      audioCodec: sound.isCarried ? audio.codec : 'opus',
      mimeType: container,
      width: shape.width,
      height: shape.height,
      frameRate: null,
      bitrateKbps: null,
      audioSampleRate: sound.isCarried ? sampleRate : 48_000,
      audioChannels: sound.isCarried ? channels : 2,
    }),

    readEngine: () => {
      const counted = frames.counts();
      const reaches = frames.reaches();

      return {
        gpu: presenter.gpu,
        decoder,
        isSoundCarried: sound.isCarried,
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
      frames.stop();
      shown.sample?.close();
      shown.sample = null;
      await sound.stop();
      presenter.destroy();
      input.dispose();
      element.style.aspectRatio = '';
    },
  };
};

export { attachEngine };
