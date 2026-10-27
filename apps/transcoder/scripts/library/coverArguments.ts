/**
 * The FFmpeg arguments for a stand-in cover: one frame of a single colour, square for an album and
 * taller than wide for a book, as their covers are.
 *
 * @param colour - The colour, as six hexadecimal digits.
 * @param shape - Whether it is an album's cover or a book's.
 * @param output - Where to write it, as a JPEG.
 * @returns The arguments.
 */
const coverArguments = (colour: string, shape: 'album' | 'book', output: string): string[] => [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-f',
  'lavfi',
  '-i',
  `color=c=0x${colour}:s=${shape === 'album' ? '600x600' : '600x900'}`,
  '-frames:v',
  '1',
  output,
];

export { coverArguments };
