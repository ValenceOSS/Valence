import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';
import { CREDITS_BOUNDS } from './SegmentProvider';

type ChapterCredits = { startSeconds: number; endSeconds: number; isSettled: boolean };

const CREDITS_NAME =
  /(^|\s)(credits?|ed|ending|outro)(?![\s:]+end)(\s|:|$)|\[sponsorblock\]:\s*(outro|endcards\/credits)/iu;

const PREVIEW_NAME =
  /(^|\s)(preview|pv|sneak\s?peek|coming\s?(up|soon)|next\s+(time|on|episode)|teaser|trailer)(?![\s:]+end)(\s|:|$)/iu;

/**
 * Finds a film's credits from its chapters, where one is named for them — "Credits", "Ending",
 * "ED", "Outro", or SponsorBlock's outro — reading from the last chapter back, as Intro Skipper
 * does. The credits run from that chapter to the next. A chapter followed by less than a credits'
 * worth of story before a preview or the end settles where the credits are; one followed by more,
 * an epilogue, leaves the frames to say.
 *
 * @param chapters - The film's chapters, in order.
 * @param durationSeconds - How long it runs.
 * @returns Where the credits run and whether the chapter settles it, or null where no chapter is
 *   named for them or the one that is runs implausibly short or long.
 */
const creditsFromChapters = (
  chapters: readonly VideoChapter[],
  durationSeconds: number,
): ChapterCredits | null => {
  const marks = [...chapters.map((chapter) => chapter.startSeconds), durationSeconds];

  for (let index = chapters.length - 1; index >= 0; index -= 1) {
    const chapter = chapters[index];
    const nextStart = marks[index + 1];

    if (chapter === undefined || nextStart === undefined) {
      continue;
    }

    if (!CREDITS_NAME.test(chapter.title ?? '')) {
      continue;
    }

    const length = nextStart - chapter.startSeconds;

    if (length < CREDITS_BOUNDS.minSeconds || length > CREDITS_BOUNDS.maxSeconds) {
      return null;
    }

    const previewAt =
      chapters.slice(index + 1).find((later) => PREVIEW_NAME.test(later.title ?? ''))
        ?.startSeconds ?? durationSeconds;

    return {
      startSeconds: chapter.startSeconds,
      endSeconds: nextStart,
      isSettled: previewAt - nextStart < CREDITS_BOUNDS.minSeconds,
    };
  }

  return null;
};

export type { ChapterCredits };

export { creditsFromChapters };
