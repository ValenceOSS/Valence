import { audiobookTitleOf } from '@ValenceContracts/functions/audiobookTitleOf';
import type { IAudioMetadata, IChapter } from 'music-metadata';
import type { ChapterMark } from '@ValenceContracts/schemas/Book';
import type { ListenBook } from './BookFile';

/**
 * Where a chapter mark falls, in seconds: its own timescale where the file gives one, and otherwise
 * milliseconds, which is how a tagged MP3's chapter frames count.
 *
 * @param at - The point, in the file's units.
 * @param timeScale - How many of those units make a second, where the file says.
 * @returns The point in seconds.
 */
const secondsOf = (at: number, timeScale: number | undefined): number =>
  at / (timeScale !== undefined && timeScale > 0 ? timeScale : 1000);

/**
 * The chapters an audiobook file marks inside itself, each from where it starts to where the next
 * begins, the last running to the end of the book. Marks out of order, or reaching past the end,
 * are put back in order and cut short.
 *
 * @param chapters - The marks the file carries.
 * @param durationSeconds - How long the file lasts.
 * @returns The marks, in seconds.
 */
const marksOf = (chapters: readonly IChapter[], durationSeconds: number): ChapterMark[] => {
  const starts = chapters
    .map((chapter) => ({
      title: chapter.title.trim(),
      startSeconds: Math.min(secondsOf(chapter.start, chapter.timeScale), durationSeconds),
      endSeconds: chapter.end === undefined ? null : secondsOf(chapter.end, chapter.timeScale),
    }))
    .toSorted((one, other) => one.startSeconds - other.startSeconds);

  return starts.map((mark, at) => ({
    title: mark.title === '' ? `Chapter ${(at + 1).toString()}` : mark.title,
    startSeconds: mark.startSeconds,
    endSeconds: Math.min(
      mark.endSeconds ?? starts[at + 1]?.startSeconds ?? durationSeconds,
      durationSeconds,
    ),
  }));
};

/**
 * Reads an audiobook's file as a book to listen to: how long it lasts, the chapters it marks inside
 * itself, where it comes among the book's tracks, and what its tags say of the book — the album is
 * the book, called what the album and the title agree on without the shop's "(Unabridged)", whoever
 * made the album wrote it, and the description or comment is its blurb. Its cover
 * is the picture it carries, the front cover where it names one.
 *
 * @param meta - What the file's tags and format say.
 * @returns The book, or nothing where the file holds no sound to listen to.
 */
const audiobookFromMetadata = (meta: IAudioMetadata): ListenBook | null => {
  const durationSeconds = meta.format.duration ?? 0;

  if (meta.format.hasAudio === false || durationSeconds <= 0) {
    return null;
  }

  const { common } = meta;
  const author = common.albumartist ?? common.artist ?? null;
  const description = common.description?.[0] ?? common.comment?.[0]?.text ?? null;
  const picture =
    common.picture?.find((each) => each.type?.toLowerCase().includes('front') === true) ??
    common.picture?.[0];

  return {
    layout: 'audio',
    durationSeconds,
    marks: marksOf(meta.format.chapters ?? [], durationSeconds),
    track: common.track.no,
    about: {
      series: common.album === undefined ? null : audiobookTitleOf(common),
      title: common.title ?? null,
      authors: author === null ? [] : [author],
      description,
    },
    readCover: () =>
      Promise.resolve(
        picture === undefined
          ? null
          : { bytes: Uint8Array.from(picture.data), contentType: picture.format },
      ),
  };
};

export { audiobookFromMetadata };
