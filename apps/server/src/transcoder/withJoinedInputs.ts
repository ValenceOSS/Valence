import type {
  MediaInput,
  MediaPart,
  SessionSpec,
  Transcoder,
} from '@ValenceServer/transcoder/TranscoderClient';

/**
 * A transcoder that reads a film kept as several files as one: every request naming the first part
 * of such a film by its path names every part instead, in order and each with its length, which the
 * transcoder reads as one input. Everything that asks for a film by its path — playback, downloads,
 * copies, thumbnails, previews, frames, intros and credits, subtitles and fonts, and the sweep that
 * keeps what is still wanted — then reaches the whole film without knowing it has parts.
 *
 * @param transcoder - The transcoder to ask.
 * @param partsOf - The parts of the film a path is the first part of, or null where it is not one.
 * @returns The same transcoder, asked through its films' parts.
 */
const withJoinedInputs = <Asked extends Transcoder>(
  transcoder: Asked,
  partsOf: (path: string) => Promise<readonly MediaPart[] | null>,
  partsOfMany: (paths: readonly string[]) => Promise<ReadonlyMap<string, readonly MediaPart[]>>,
): Asked => {
  /**
   * The input a request names, joined where it is the first part of a film kept as several.
   *
   * @param input - What the request names.
   * @returns What the transcoder is to read.
   */
  const joined = async (input: MediaInput): Promise<MediaInput> =>
    typeof input === 'string' ? ((await partsOf(input)) ?? input) : input;

  /**
   * A session's specification, reading the whole film where it names its first part.
   *
   * @param spec - The specification.
   * @returns It, its input joined.
   */
  const joinedSpec = async (spec: SessionSpec): Promise<SessionSpec> => ({
    ...spec,
    inputPath: await joined(spec.inputPath),
  });

  /**
   * Any request naming an input, reading the whole film where it names its first part.
   *
   * @param request - The request.
   * @returns It, its input joined.
   */
  const joinedRequest = async <Request extends { inputPath: MediaInput }>(
    request: Request,
  ): Promise<Request> => ({ ...request, inputPath: await joined(request.inputPath) });

  /**
   * Every request a sweep keeps, each reading the whole film where it names a first part, the
   * parts of all of them found at once.
   *
   * @param keep - The requests.
   * @returns Them, their inputs joined.
   */
  const joinedKeep = async <Request extends { inputPath: MediaInput }>(
    keep: readonly Request[],
  ): Promise<Request[]> => {
    const parts = await partsOfMany(
      keep.flatMap((request) => (typeof request.inputPath === 'string' ? [request.inputPath] : [])),
    );

    return keep.map((request) =>
      typeof request.inputPath === 'string'
        ? { ...request, inputPath: parts.get(request.inputPath) ?? request.inputPath }
        : request,
    );
  };

  const { creditFrames, readPictureSubtitle, generateSubtitle } = transcoder;

  return {
    ...transcoder,
    startSession: async (spec, deviceId, variants) =>
      transcoder.startSession(
        await joinedSpec(spec),
        deviceId,
        variants === undefined ? undefined : await Promise.all(variants.map(joinedSpec)),
      ),
    requestDownload: async (request) =>
      transcoder.requestDownload({ ...request, spec: await joinedSpec(request.spec) }),
    requestRendition: async (request) =>
      transcoder.requestRendition({ ...request, spec: await joinedSpec(request.spec) }),
    fingerprint: async (request) => transcoder.fingerprint(await joinedRequest(request)),
    readSubtitle: async (request) => transcoder.readSubtitle(await joinedRequest(request)),
    listFonts: async (request) => transcoder.listFonts(await joinedRequest(request)),
    readFont: async (request) => transcoder.readFont(await joinedRequest(request)),
    readFrame: async (request) => transcoder.readFrame(await joinedRequest(request)),
    requestPreview: async (request) => transcoder.requestPreview(await joinedRequest(request)),
    requestTrickplay: async (request) => transcoder.requestTrickplay(await joinedRequest(request)),
    forgetPreview: async (request) => transcoder.forgetPreview(await joinedRequest(request)),
    forgetTrickplay: async (request) => transcoder.forgetTrickplay(await joinedRequest(request)),
    sweepPreviews: async (keep) => transcoder.sweepPreviews(await joinedKeep(keep)),
    sweepTrickplay: async (keep) => transcoder.sweepTrickplay(await joinedKeep(keep)),
    ...(creditFrames === undefined
      ? {}
      : { creditFrames: async (request) => creditFrames(await joinedRequest(request)) }),
    ...(readPictureSubtitle === undefined
      ? {}
      : {
          readPictureSubtitle: async (request) => readPictureSubtitle(await joinedRequest(request)),
        }),
    ...(generateSubtitle === undefined
      ? {}
      : { generateSubtitle: async (request) => generateSubtitle(await joinedRequest(request)) }),
  };
};

export { withJoinedInputs };
