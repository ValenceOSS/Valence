import { renditionFor } from './renditionFor';
import type { ListeningSession, MusicNowPlaying } from '@ValenceContracts/schemas/MusicRemote';
import type { TrackFile } from './MusicService';

/**
 * What an operator is told about a device playing music: the song, where it has got to, and how it
 * is reaching the device — the file as it is, or an encode made for it, with the codec and bitrate
 * either way, the same question the sessions page answers for a film.
 *
 * @param nowPlaying - What the device last said it was playing.
 * @param file - The track as it is on the disk, or nothing where it could not be read.
 * @returns The listening session.
 */
const listeningFor = (nowPlaying: MusicNowPlaying, file: TrackFile | null): ListeningSession => {
  const rendition = file === null ? null : renditionFor(file, nowPlaying.quality);
  const isEncoded = rendition?.kind === 'encoded';

  return {
    trackId: nowPlaying.trackId,
    title: nowPlaying.title,
    artists: nowPlaying.artists,
    albumId: nowPlaying.albumId,
    hasArtwork: nowPlaying.hasArtwork,
    isPlaying: nowPlaying.isPlaying,
    positionSeconds: nowPlaying.positionSeconds,
    durationSeconds: nowPlaying.durationSeconds,
    reportedAtMs: nowPlaying.reportedAtMs,
    quality: nowPlaying.quality,
    delivery: isEncoded ? 'encoded' : 'direct',
    codec: isEncoded ? 'aac' : (file?.codec ?? null),
    kbps: rendition?.kind === 'encoded' ? rendition.kbps : (file?.bitrateKbps ?? null),
  };
};

export { listeningFor };
