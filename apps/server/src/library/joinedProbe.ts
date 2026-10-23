import type { MediaProbe } from '@ValenceServer/transcoder/TranscoderClient';

/**
 * What has to be the same in every part of a film for its parts to be read as one input: the
 * concat demuxer carries the first part's streams through, so a part with another codec, size or
 * track would play wrong after the join.
 *
 * @param probe - One part, as probed.
 * @returns Its streams, written so two parts can be compared.
 */
const layoutOf = (probe: MediaProbe): string =>
  JSON.stringify({
    video:
      probe.video === null
        ? null
        : [
            probe.video.index,
            probe.video.codec,
            probe.video.width,
            probe.video.height,
            probe.video.range,
            probe.video.bitDepth,
          ],
    audio: probe.audioStreams.map((stream) => [
      stream.index,
      stream.codec,
      stream.channels,
      stream.sampleRate,
    ]),
    subtitles: probe.subtitleStreams.map((stream) => [stream.index, stream.format]),
  });

/**
 * A film kept as several files described as the one it plays as: the first part's streams, every
 * part's length added up, and every part's chapters moved on by the length of the parts before it.
 * Nothing where the parts' streams are not alike, since those cannot be read as one input.
 *
 * @param probes - Each part, as probed, in order.
 * @returns The film, or null where its parts cannot be joined.
 */
const joinedProbe = (probes: readonly MediaProbe[]): MediaProbe | null => {
  const first = probes[0];

  if (first === undefined || probes.some((probe) => layoutOf(probe) !== layoutOf(first))) {
    return null;
  }

  let offset = 0;
  const chapters: MediaProbe['chapters'] = [];

  for (const probe of probes) {
    const at = offset;

    chapters.push(
      ...probe.chapters.map((chapter) => ({
        ...chapter,
        startSeconds: chapter.startSeconds + at,
        endSeconds: chapter.endSeconds + at,
      })),
    );
    offset += probe.durationSeconds;
  }

  return { ...first, durationSeconds: offset, chapters };
};

export { joinedProbe };
