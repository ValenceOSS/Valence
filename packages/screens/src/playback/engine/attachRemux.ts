import { ALL_FORMATS, EncodedPacketSink, Input, UrlSource } from 'mediabunny';
import { soundDecodedHere } from './soundDecodedHere';
import { createMediaFeed } from './createMediaFeed';
import { createThroughputMeter } from './createThroughputMeter';
import type { DeliveredFormat } from '@ValenceScreens/playback/attachShaka';
import type { EngineStats } from './EngineStats';

const NEAR_THE_END_SECONDS = 0.25;

type RemuxOptions = {
  element: HTMLVideoElement;
  url: string;
  startSeconds: number;
  audioTrackAt: number;
  onFault: () => void;
};

/**
 * Plays a file whose picture the media element decodes, but in a container or with a sound it does
 * not take, by repackaging it here rather than on the server: the picture is copied exactly as it
 * was encoded into fragmented MP4 alongside the chosen sound, and handed to the element, which
 * decodes and shows it as it would a file of its own — so HDR and Dolby Vision reach an HDR screen
 * as HDR, through the browser's own pipeline.
 *
 * A seek outside what the element holds starts the repackaging again from the key frame before it.
 * Anything that fails is said once through `onFault`, for the player to hand the film to the server
 * instead.
 *
 * @param options - The element, the file, where to start, which sound track (counted from the first
 *   in the file), and where to say a failure.
 * @returns A handle carrying the teardown to call, how fast the connection is delivering the film,
 *   and readings of what is being played, for the
 *   stats.
 */
const attachRemux = async ({
  element,
  url,
  startSeconds,
  audioTrackAt,
  onFault,
}: RemuxOptions): Promise<{
  detach: () => Promise<void>;
  readDelivered: () => DeliveredFormat;
  readEngine: () => EngineStats;
  readEstimatedKbps: () => number | null;
}> => {
  const life = { isOver: false, hasFailed: false };
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

  if (video === null || audio === null) {
    input.dispose();

    throw new Error('The file has no picture and sound to repackage.');
  }

  const [pictureCodec, channels, sampleRate, isHdrFilm, container] = await Promise.all([
    video.getCodecParameterString(),
    audio.getNumberOfChannels(),
    audio.getSampleRate(),
    video.hasHighDynamicRange(),
    input.getMimeType(),
  ]);
  const frameRate =
    (await video.computePacketStats(100).catch(() => null))?.averagePacketRate ?? null;
  const feed = await createMediaFeed({
    element,
    input,
    duration,
    track: audio,
    picture: video,
    decodesHere: await soundDecodedHere(audio),
    soundPackets: new EncodedPacketSink(audio),
    onFault: fail,
  });

  const onSeeking = () => {
    const at = element.currentTime;

    if (!feed.holds(at) && at < duration - NEAR_THE_END_SECONDS) {
      void feed.startAt(at).catch(() => {
        fail();
      });
    }
  };

  await feed.startAt(startSeconds);
  element.currentTime = startSeconds;
  element.addEventListener('seeking', onSeeking);

  return {
    readDelivered: () => ({
      videoCodec: pictureCodec,
      audioCodec: feed.sound.parameter,
      mimeType: 'video/mp4',
      width: video.squarePixelWidth,
      height: video.squarePixelHeight,
      frameRate,
      bitrateKbps: feed.bitrateAt(element.currentTime),
      audioSampleRate: feed.sound.kind === 'carried' ? sampleRate : 48_000,
      audioChannels: feed.sound.kind === 'carried' ? channels : feed.sound.numberOfChannels,
    }),

    readEstimatedKbps: throughput.readKbps,

    readEngine: () => ({
      route: 'remux',
      gpu: null,
      hdrSignal: null,
      isHdrFilm,
      container,
      sound: feed.sound.kind === 'carried' ? 'carried' : feed.sound.codec,
      soundChannels: feed.sound.kind === 'carried' ? channels : feed.sound.numberOfChannels,
      decodedFrames: 0,
      drawnFrames: 0,
      skippedFrames: 0,
      decodedAheadSeconds: null,
    }),

    detach: async () => {
      life.isOver = true;
      element.removeEventListener('seeking', onSeeking);
      await feed.stop();
      input.dispose();
    },
  };
};

export { attachRemux };
