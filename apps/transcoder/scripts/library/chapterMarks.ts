/**
 * Writes the FFmpeg metadata file that marks a spoken book's chapters, splitting its length evenly
 * between them, so a single file carries chapters as a real one does.
 *
 * @param seconds - How long the file runs.
 * @param chapters - How many chapters to mark.
 * @returns The file's contents.
 */
const chapterMarks = (seconds: number, chapters: number): string => {
  const length = seconds * 1000;
  const marks = Array.from({ length: chapters }, (_, at) =>
    [
      '[CHAPTER]',
      'TIMEBASE=1/1000',
      `START=${Math.round((length * at) / chapters).toString()}`,
      `END=${Math.round((length * (at + 1)) / chapters).toString()}`,
      `title=Chapter ${(at + 1).toString()}`,
    ].join('\n'),
  );

  return [';FFMETADATA1', ...marks, ''].join('\n');
};

export { chapterMarks };
