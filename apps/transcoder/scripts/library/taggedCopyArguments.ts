import { AUDIO_RECIPES } from './audioClipArguments';

type TaggedCopy = {
  clip: string;
  output: string;
  extension: string;
  tags: readonly (readonly [string, string])[];
  chapters: string | null;
};

/**
 * The FFmpeg arguments that copy a stand-in audio clip to where a file belongs, carrying that file's
 * own tags and, for a spoken book, its chapters, without encoding it again.
 *
 * @param copy - The clip, where the copy goes, its container, its tags, and the chapter marks file.
 * @returns The arguments, or null for a container there is no recipe for.
 */
const taggedCopyArguments = ({
  clip,
  output,
  extension,
  tags,
  chapters,
}: TaggedCopy): string[] | null => {
  const recipe = AUDIO_RECIPES[extension.toLowerCase()];

  if (recipe === undefined) {
    return null;
  }

  return [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    clip,
    ...(chapters === null ? [] : ['-i', chapters, '-map_chapters', '1']),
    '-map',
    '0:a',
    '-c',
    'copy',
    ...(recipe.format === 'mp3' ? ['-id3v2_version', '3'] : []),
    ...(recipe.format === 'adts' ? ['-write_id3v2', '1'] : []),
    ...tags.flatMap(([key, value]) => ['-metadata', `${key}=${value}`]),
    '-f',
    recipe.format,
    output,
  ];
};

export type { TaggedCopy };

export { taggedCopyArguments };
