import { chapterPlaying } from '@ValenceClient/books/chapterPlaying';
import { describeSpeed } from '@ValenceClient/books/describeSpeed';
import { LISTENING_CHOICES } from '@ValenceClient/books/LISTENING_CHOICES';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import type { AudiobookPlayerState } from '@ValenceClient/books/createAudiobookPlayer';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

type ListeningPanel = 'speed' | 'sleep' | 'chapters';

type ListeningChoice = {
  id: string;
  label: string;
  detail?: string;
  isCurrent: boolean;
};

/**
 * What one of an audiobook player's lists offers: the speeds it plays at, when a sleep timer stops
 * it, or its chapters with how long each lasts — the one chosen now marked in each.
 *
 * @param panel - Which list.
 * @param state - What the player is doing.
 * @returns What there is to choose from.
 */
const listeningChoices = (
  panel: ListeningPanel,
  state: AudiobookPlayerState,
): ListeningChoice[] => {
  if (panel === 'speed') {
    return LISTENING_CHOICES.speeds.map((speed) => ({
      id: speed.toString(),
      label: describeSpeed(speed),
      isCurrent: speed === state.speed,
    }));
  }

  if (panel === 'sleep') {
    return [
      {
        id: 'off',
        label: say('client.listeningChoices.off'),
        isCurrent: state.sleep.kind === 'off',
      },
      ...LISTENING_CHOICES.sleepMinutes.map((minutes) => ({
        id: minutes.toString(),
        label: sayCount('client.listeningChoices.minutes', minutes),
        isCurrent: false,
      })),
      {
        id: 'endOfChapter',
        label: say('client.listeningChoices.endOfChapter'),
        isCurrent: state.sleep.kind === 'endOfChapter',
      },
    ];
  }

  const at = chapterPlaying(state);

  return state.chapters.map((chapter, index) => ({
    id: index.toString(),
    label: chapter.title,
    detail: formatDuration(chapter.bookEndSeconds - chapter.bookStartSeconds),
    isCurrent: index === at,
  }));
};

export type { ListeningChoice, ListeningPanel };

export { listeningChoices };
