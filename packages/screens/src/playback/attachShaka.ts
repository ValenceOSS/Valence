import { z } from 'zod';
import { deliveredBitrateKbps } from '@ValenceClient/playback/deliveredBitrateKbps';
import { teachShakaOurScheme } from '@ValenceScreens/playback/teachShakaOurScheme';
import type { ShakaNetworking } from '@ValenceScreens/playback/teachShakaOurScheme';
import type shaka from 'shaka-player/dist/shaka-player.compiled';
import type { Buffer } from '@ValenceClient/playback/bufferFor';

type ShakaVariant = {
  active: boolean;
  videoCodec?: string | null;
  audioCodec?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  frameRate?: number | null;
  bandwidth?: number | null;
  audioSamplingRate?: number | null;
  channelsCount?: number | null;
};

type ShakaStats = {
  bytesDownloaded?: number;
  playTime?: number;
  streamBandwidth?: number;
  estimatedBandwidth?: number;
};

type ShakaPlayer = {
  attach: (element: HTMLMediaElement) => Promise<void>;
  configure?: (config: {
    manifest?: {
      hls: {
        sequenceMode: boolean;
        ignoreManifestTimestampsInSegmentsMode: boolean;
        disableClosedCaptionsDetection: boolean;
      };
    };
    streaming?: {
      bufferingGoal?: number;
      bufferBehind?: number;
      segmentPrefetchLimit?: number;
    };
    abr?: {
      defaultBandwidthEstimate: number;
    };
  }) => void;
  load: (manifestUrl: string, startSeconds?: number) => Promise<void>;
  destroy: () => Promise<void>;
  addEventListener?: (name: string, listener: (event: Event) => void) => void;
  getVariantTracks?: () => ShakaVariant[];
  getStats?: () => ShakaStats;
};

type ShakaModule = {
  polyfill: { installAll: () => void };
  Player: new () => ShakaPlayer;
  net?: ShakaNetworking;
};

const PlaybackFaultSchema = z.object({
  detail: z.object({
    severity: z.number().int(),
    category: z.number().int(),
    code: z.number().int(),
  }),
});

const BAD_HTTP_STATUS = 1001;

const HttpStatusSchema = z.object({
  detail: z.object({
    code: z.literal(BAD_HTTP_STATUS),
    data: z.tuple([z.string(), z.number().int()], z.json()),
  }),
});

type PlaybackFault = z.infer<typeof PlaybackFaultSchema>['detail'] & { httpStatus: number | null };

type AttachOptions = {
  element: HTMLVideoElement;
  manifestUrl: string;
  startSeconds?: number;
  isSomeoneElses?: boolean;
  buffer?: Buffer;
  connections?: number;
  onFault?: (fault: PlaybackFault) => void;
  onRecovered?: (refusedAtSeconds: number) => void;
  loadShaka?: () => Promise<ShakaModule>;
};

const CRITICAL = 2;

const HAS_A_PICTURE = 2;

const ONE_AT_A_TIME = 1;

const FIRST_GUESS_AT_THE_CONNECTION = 5_000_000;

const READING_THE_PLAYLIST = {
  manifest: {
    hls: {
      sequenceMode: false,
      ignoreManifestTimestampsInSegmentsMode: true,
      disableClosedCaptionsDetection: true,
    },
  },
} as const;

type DeliveredFormat = {
  videoCodec: string | null;
  audioCodec: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  frameRate: number | null;
  bitrateKbps: number | null;
  audioSampleRate: number | null;
  audioChannels: number | null;
};

type AttachedStream = {
  detach: () => Promise<void>;
  readDelivered: () => DeliveredFormat | null;
  readEstimatedKbps: () => number | null;
  readLadder: () => { variants: number; activeHeight: number | null };
};

/**
 * Reads what the engine is actually being sent, rather than what was asked for.
 *
 * The two are not the same thing and the difference is worth seeing: a plan describes an intention,
 * and the variant the engine selected describes the bytes arriving. Where a transcode does
 * something other than what was negotiated — a range it could not convert, a codec it substituted —
 * this is where it shows.
 *
 * @param variants - The variants the engine knows about.
 * @returns The active one, or nothing where the engine has not selected one yet.
 */
const mediaFetched = (element: HTMLVideoElement): number => {
  try {
    const ranges = element.buffered;

    return ranges.length === 0 ? 0 : ranges.end(ranges.length - 1);
  } catch {
    return 0;
  }
};

const deliveredFormat = (
  variants: readonly ShakaVariant[],
  stats: ShakaStats | null,
  measuredKbps: number | null = null,
): DeliveredFormat | null => {
  const active = variants.find((variant) => variant.active);

  if (active === undefined) {
    return null;
  }

  return {
    videoCodec: active.videoCodec ?? null,
    audioCodec: active.audioCodec ?? null,
    mimeType: active.mimeType ?? null,
    width: active.width ?? null,
    height: active.height ?? null,
    frameRate: active.frameRate ?? null,
    bitrateKbps:
      deliveredBitrateKbps({
        declaredBandwidth: active.bandwidth ?? stats?.streamBandwidth,
        bytesFetched: null,
        mediaSecondsFetched: null,
      }) ?? measuredKbps,
    audioSampleRate: active.audioSamplingRate ?? null,
    audioChannels: active.channelsCount ?? null,
  };
};

/**
 * Loads Shaka Player the first time something needs it. Not part of the main bundle: it is a large
 * dependency, and a session that turns out to be direct play never needs it at all.
 */
const loadShakaPlayer = async (): Promise<ShakaModule> => {
  const imported: typeof shaka = (await import('shaka-player/dist/shaka-player.compiled')).default;

  return imported;
};

/**
 * Reads an error out of an event the media engine raised, checking rather than trusting it —
 * everything about the event comes from the engine, and an event carrying no error is not a fault
 * worth reporting.
 *
 * @param event - The event the engine raised.
 * @returns The fault, or null where the event carried none.
 */
const faultFrom = (event: Event): PlaybackFault | null => {
  const found = PlaybackFaultSchema.safeParse(event);
  const status = HttpStatusSchema.safeParse(event);

  return found.success
    ? { ...found.data.detail, httpStatus: status.success ? status.data.detail.data[1] : null }
    : null;
};

/**
 * Attaches the media engine to a video element and loads a stream into it, starting at a given
 * position where one was asked for. The position goes into the load rather than being set on the
 * element afterwards: the engine decides where playback begins as it finishes loading, and will
 * overwrite anything set before then — which looks exactly like a resume that worked for an instant
 * and then went back to the beginning.
 *
 * @param options - The element to attach to, the manifest to load, where to start, whether the
 *   stream is one Valence did not make, how much to hold ahead and behind, how many segments to
 *   fetch at once, how to report a fault the engine could not recover from, and what to do once it
 *   has started the element again after the browser refused to decode what it was sent.
 * @returns A handle carrying the teardown to call — an orphaned engine keeps buffering and holds
 *   the element open — a reading of what the engine is actually being sent, its estimate of what
 *   the connection carries, and how many qualities it can switch between on its own. A stream that
 *   fails to load takes its engine down with it before the failure is passed on.
 *
 * Shaka is told to place each segment by the timestamps inside it rather than by where the
 * playlist says it begins. Its default moves a segment to the playlist's time, and on a copied
 * stream that drops the frames a keyframe opens with at a join — measured on a 4K HEVC remux and
 * again on a Bluray, a quarter of a second lost at each. Taking the timestamps from the order
 * segments arrive in avoided that, but kept audio and video in one buffer's timeline: with the two
 * sent apart it lets them drift, and it put the sound 60ms late after a seek even together, while
 * the segments' own timestamps held it within a frame. See VAL-307.
 *
 * Nor does it look for captions carried inside the picture, which Valence never offers — subtitles
 * go as tracks of their own. Looking means fetching the first, middle and last segments of the
 * film, and to a transcode positioned where somebody resumed, the first and the last are two seeks
 * that pull it away from them, so the film never loads.
 *
 * Several segments are fetched at once where this device asked for more than one connection, so a
 * connection whose throughput wavers is not the whole of what the stream gets. Never more than four:
 * the transcoder starts again from wherever a viewer asks once it is 24 seconds behind them, and
 * four segments at double speed is as far ahead as that leaves room for. See VAL-367.
 *
 * A picture the browser refuses to decode is not reported as a fault. The engine empties the element
 * and starts it again where it was, and says so with an event of its own, which is passed on with
 * where the element last was while it had a picture, or where it refused, since by then it has
 * been emptied and reads nothing, and not every such start follows the element refusing anything. A
 * stream that copies a damaged file meets the same frame again, and only the server converting it
 * gets past.
 *
 * None of that holds for a stream Valence did not make, such as a live channel's: its segments'
 * own timestamps are a broadcaster's, often starting far from nothing, and placed by them nothing
 * ever plays. Such a stream is read the way the engine reads any HLS.
 */
const attachShaka = async ({
  element,
  manifestUrl,
  startSeconds = 0,
  isSomeoneElses = false,
  buffer,
  connections = ONE_AT_A_TIME,
  onFault,
  onRecovered,
  loadShaka = loadShakaPlayer,
}: AttachOptions): Promise<AttachedStream> => {
  const shaka = await loadShaka();

  shaka.polyfill.installAll();

  if (shaka.net !== undefined) {
    teachShakaOurScheme(shaka.net, globalThis.location.protocol);
  }

  const player = new shaka.Player();

  if (!isSomeoneElses) {
    player.configure?.(READING_THE_PLAYLIST);
  }
  player.configure?.({ abr: { defaultBandwidthEstimate: FIRST_GUESS_AT_THE_CONNECTION } });

  if (buffer !== undefined) {
    player.configure?.({
      streaming: { bufferingGoal: buffer.aheadSeconds, bufferBehind: buffer.behindSeconds },
    });
  }

  player.configure?.({
    streaming: { segmentPrefetchLimit: Math.max(connections, ONE_AT_A_TIME) - ONE_AT_A_TIME },
  });

  player.addEventListener?.('error', (event) => {
    const fault = faultFrom(event);

    if (fault !== null) {
      onFault?.(fault);
    }
  });

  const refused = { atSeconds: startSeconds };
  const noteWhereRefused = () => {
    refused.atSeconds = element.currentTime;
  };
  const noteWhereItIs = () => {
    if (element.readyState >= HAS_A_PICTURE) {
      refused.atSeconds = element.currentTime;
    }
  };

  element.addEventListener('error', noteWhereRefused);
  element.addEventListener('timeupdate', noteWhereItIs);
  player.addEventListener?.('mediasourcerecovered', () => {
    onRecovered?.(refused.atSeconds);
  });

  const detach = () => {
    element.removeEventListener('error', noteWhereRefused);
    element.removeEventListener('timeupdate', noteWhereItIs);

    return player.destroy();
  };

  try {
    await player.attach(element);

    if (startSeconds > 0) {
      await player.load(manifestUrl, startSeconds);
    } else {
      await player.load(manifestUrl);
    }
  } catch (error) {
    await detach().catch(() => undefined);

    throw error;
  }

  let lastSample: { bytes: number; mediaSeconds: number } | null = null;
  let measuredKbps: number | null = null;

  return {
    detach,
    readLadder: () => {
      const variants = player.getVariantTracks?.() ?? [];
      const heights = new Set(variants.map((variant) => variant.height ?? 0));

      return {
        variants: heights.size,
        activeHeight: variants.find((variant) => variant.active)?.height ?? null,
      };
    },
    readEstimatedKbps: () => {
      const estimated = player.getStats?.().estimatedBandwidth;

      return typeof estimated === 'number' && Number.isFinite(estimated) && estimated > 0
        ? Math.round(estimated / 1000)
        : null;
    },
    readDelivered: () => {
      const stats = player.getStats?.() ?? null;
      const sample = { bytes: stats?.bytesDownloaded ?? 0, mediaSeconds: mediaFetched(element) };

      const bytesFetched = sample.bytes - (lastSample?.bytes ?? 0);
      const mediaSecondsFetched = sample.mediaSeconds - (lastSample?.mediaSeconds ?? 0);

      if (lastSample === null || bytesFetched < 0 || mediaSecondsFetched < 0) {
        lastSample = sample;
      } else {
        const measured = deliveredBitrateKbps({
          declaredBandwidth: null,
          bytesFetched,
          mediaSecondsFetched,
        });

        if (measured !== null) {
          measuredKbps = measured;
          lastSample = sample;
        }
      }

      return deliveredFormat(player.getVariantTracks?.() ?? [], stats, measuredKbps);
    },
  };
};

export type { AttachedStream, DeliveredFormat, ShakaModule, ShakaPlayer, ShakaStats, ShakaVariant };

export { attachShaka, deliveredFormat, faultFrom, CRITICAL };
