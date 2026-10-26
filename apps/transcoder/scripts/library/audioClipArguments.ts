const AUDIO_RECIPES: Readonly<Record<string, { codec: readonly string[]; format: string }>> = {
  mp3: { codec: ['-c:a', 'libmp3lame', '-b:a', '64k'], format: 'mp3' },
  flac: { codec: ['-c:a', 'flac'], format: 'flac' },
  m4a: { codec: ['-c:a', 'aac'], format: 'ipod' },
  m4b: { codec: ['-c:a', 'aac'], format: 'ipod' },
  alac: { codec: ['-c:a', 'alac'], format: 'ipod' },
  aac: { codec: ['-c:a', 'aac'], format: 'adts' },
  ogg: { codec: ['-c:a', 'libopus'], format: 'ogg' },
  oga: { codec: ['-c:a', 'libopus'], format: 'ogg' },
  opus: { codec: ['-c:a', 'libopus'], format: 'opus' },
  wav: { codec: ['-c:a', 'pcm_s16le'], format: 'wav' },
  aiff: { codec: ['-c:a', 'pcm_s16be'], format: 'aiff' },
  aif: { codec: ['-c:a', 'pcm_s16be'], format: 'aiff' },
  wma: { codec: ['-c:a', 'wmav2'], format: 'asf' },
  wv: { codec: ['-c:a', 'wavpack'], format: 'wv' },
};

/**
 * The FFmpeg arguments for one silent stand-in audio clip, in a codec its container holds and that
 * FFmpeg can write, untagged: each file made from it is a copy carrying its own tags.
 *
 * @param extension - The container, by its file extension.
 * @param seconds - How long the clip runs.
 * @param output - Where to write it.
 * @returns The arguments, or null for a container there is no recipe for.
 */
const audioClipArguments = (
  extension: string,
  seconds: number,
  output: string,
): string[] | null => {
  const recipe = AUDIO_RECIPES[extension.toLowerCase()];

  if (recipe === undefined) {
    return null;
  }

  return [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-f',
    'lavfi',
    '-i',
    'anullsrc=r=44100:cl=stereo',
    '-t',
    seconds.toString(),
    ...recipe.codec,
    '-f',
    recipe.format,
    output,
  ];
};

export { AUDIO_RECIPES, audioClipArguments };
