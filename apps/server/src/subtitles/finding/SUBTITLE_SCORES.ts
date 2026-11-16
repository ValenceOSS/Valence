const SUBTITLE_SCORES = {
  movie: {
    title: 60,
    year: 40,
    source: 30,
    edition: 30,
    releaseGroup: 15,
    audioCodec: 1,
    resolution: 1,
    videoCodec: 1,
    hearingImpaired: 1,
    streamingService: 1,
  },
  episode: {
    series: 160,
    year: 90,
    season: 30,
    episode: 30,
    source: 25,
    releaseGroup: 20,
    audioCodec: 1,
    resolution: 1,
    videoCodec: 1,
    hearingImpaired: 1,
    streamingService: 1,
  },
} as const satisfies Record<'movie' | 'episode', Record<string, number>>;

export { SUBTITLE_SCORES };
