/* oxlint-disable valence/no-hard-coded-strings -- Valence's own plan reason codes and playback modes, which its apps match on and no person reads */
import { saying } from '@ValenceI18n/saying';
import type { JellyfinContext } from '@ValenceClient/jellyfin/JellyfinContext';
import type { JellyfinMediaSource } from '@ValenceClient/jellyfin/JellyfinSchemas';

/**
 * What Valence's apps are told when playback starts on a Jellyfin server: where to play it from,
 * the file itself where Jellyfin would hand it over as it is and Jellyfin's own converted stream
 * where it would not, both carrying the token since a player sends nothing else, and a plan that
 * says which.
 *
 * @param source - The way of playing it Jellyfin chose.
 * @param playSessionId - Jellyfin's identifier for this playback.
 * @param mediaId - The Valence identifier of what is played.
 * @param jellyfinId - Jellyfin's identifier of what is played.
 * @param context - The server and the token.
 * @returns The session, as Valence's playback endpoint answers.
 */
const startedSessionOfJellyfin = (
  source: JellyfinMediaSource,
  playSessionId: string,
  mediaId: string,
  jellyfinId: string,
  context: Pick<JellyfinContext, 'address' | 'token'>,
) => {
  const isDirect =
    source.SupportsDirectPlay === true ||
    source.TranscodingUrl === null ||
    source.TranscodingUrl === undefined;
  const reason = {
    code: isDirect ? 'ClientSupportsSource' : 'ContainerNotSupported',
    detail: saying(
      isDirect
        ? 'client.jellyfin.jellyfinSendsTheFileAsItIs'
        : 'client.jellyfin.jellyfinConvertsTheFile',
    ),
  };
  const query = new URLSearchParams({
    static: 'true',
    MediaSourceId: source.Id,
    PlaySessionId: playSessionId,
    api_key: context.token,
  });

  return {
    sessionId: playSessionId,
    delivery: isDirect
      ? {
          kind: 'direct' as const,
          url: `${context.address}/Videos/${jellyfinId}/stream?${query.toString()}`,
        }
      : {
          kind: 'hls' as const,
          manifestUrl: `${context.address}${source.TranscodingUrl ?? ''}`,
          dashUrl: null,
        },
    mode: isDirect ? 'DirectPlay' : 'Transcode',
    plan: {
      mediaId,
      container: { kind: 'passthrough', reason },
      video: { kind: 'passthrough', reason },
      audio: { kind: 'passthrough', streamIndex: null, reason },
      subtitles: { kind: 'none', reason },
    },
    warnings: [],
    reuse: null,
    keptCopies: [],
    playsEpisodesGapless: false,
  };
};

export { startedSessionOfJellyfin };
