const H264_AAC = { video: ['-c:v', 'libx264', '-tune', 'stillimage'], audio: ['-c:a', 'aac'] };

const CODECS: Readonly<Record<string, { video: readonly string[]; audio: readonly string[] }>> = {
  mkv: H264_AAC,
  mp4: H264_AAC,
  m4v: H264_AAC,
  mov: H264_AAC,
  ts: H264_AAC,
  m2ts: H264_AAC,
  flv: H264_AAC,
  '3gp': H264_AAC,
  avi: { video: H264_AAC.video, audio: ['-c:a', 'ac3'] },
  webm: { video: ['-c:v', 'libvpx-vp9', '-deadline', 'realtime'], audio: ['-c:a', 'libopus'] },
  ogv: { video: ['-c:v', 'libtheora'], audio: ['-c:a', 'libvorbis'] },
  mpg: { video: ['-c:v', 'mpeg2video'], audio: ['-c:a', 'mp2'] },
  mpeg: { video: ['-c:v', 'mpeg2video'], audio: ['-c:a', 'mp2'] },
  wmv: { video: ['-c:v', 'wmv2'], audio: ['-c:a', 'wmav2'] },
};

/**
 * The FFmpeg arguments for one stand-in clip: a black picture and a silent stereo track tagged as
 * English, as long as asked, in codecs its container can hold, so the scanner probes it like any
 * other file.
 *
 * @param extension - The container, by its file extension.
 * @param seconds - How long the clip runs.
 * @param output - Where to write it.
 * @returns The arguments, or null for a container there is no recipe for.
 */
const clipArguments = (extension: string, seconds: number, output: string): string[] | null => {
  const codecs = CODECS[extension.toLowerCase()];

  if (codecs === undefined) {
    return null;
  }

  const length = seconds.toString();

  return [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-f',
    'lavfi',
    '-i',
    `color=c=black:s=320x180:r=25:d=${length}`,
    '-f',
    'lavfi',
    '-i',
    'anullsrc=r=48000:cl=stereo',
    '-t',
    length,
    '-map',
    '0:v',
    '-map',
    '1:a',
    '-pix_fmt',
    'yuv420p',
    ...codecs.video,
    ...codecs.audio,
    '-metadata:s:a:0',
    'language=eng',
    output,
  ];
};

export { clipArguments };
