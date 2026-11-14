/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own field values and kinds, which its apps match on and no person reads */
import { jellyfinIdOf } from '@ValenceServer/jellyfin/jellyfinIdOf';
import { jellyfinMediaStreamsOf } from '@ValenceServer/jellyfin/jellyfinMediaStreamsOf';
import { jellyfinStreamIndexOf } from '@ValenceServer/jellyfin/jellyfinStreamIndexOf';
import { ticksOf } from '@ValenceServer/jellyfin/ticksOf';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';
import type { JellyfinMediaSource } from '@ValenceServer/jellyfin/JellyfinDtos';

/**
 * A file as Jellyfin describes a way of playing it: what it is held in, how long it runs, and its
 * streams. Whether it is to be played as it is or converted is said once playback is asked for.
 *
 * @param item - The file.
 * @returns Its media source.
 */
const jellyfinMediaSourceOf = (item: MediaDetail): JellyfinMediaSource => {
  const id = jellyfinIdOf(item.id);
  const audio = item.audioStreams.find((stream) => stream.isDefault) ?? item.audioStreams[0];

  return {
    Protocol: 'File',
    Id: id,
    Type: 'Default',
    Container: item.container,
    ...(item.sizeBytes === null || item.sizeBytes === undefined ? {} : { Size: item.sizeBytes }),
    Name: item.versionLabel ?? item.title,
    IsRemote: false,
    ETag: id,
    RunTimeTicks: ticksOf(item.durationSeconds),
    ReadAtNativeFramerate: false,
    IgnoreDts: false,
    IgnoreIndex: false,
    GenPtsInput: false,
    SupportsTranscoding: true,
    SupportsDirectStream: true,
    SupportsDirectPlay: true,
    IsInfiniteStream: false,
    RequiresOpening: false,
    RequiresClosing: false,
    RequiresLooping: false,
    SupportsProbing: true,
    MediaStreams: jellyfinMediaStreamsOf(item),
    MediaAttachments: [],
    Formats: [],
    Bitrate: item.bitrateKbps * 1000,
    ...(audio === undefined ? {} : { DefaultAudioStreamIndex: jellyfinStreamIndexOf(audio.index) }),
  };
};

export { jellyfinMediaSourceOf };
