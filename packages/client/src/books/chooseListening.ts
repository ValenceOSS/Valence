import type { AudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';
import type { ListeningPanel } from '@ValenceClient/books/listeningChoices';

/**
 * Does what was chosen from one of an audiobook player's lists: plays at the speed, sets the sleep
 * timer, or goes straight to the chapter.
 *
 * @param player - The player.
 * @param panel - Which list it was chosen from.
 * @param id - What was chosen, as the list names it.
 */
const chooseListening = (player: AudiobookPlayer, panel: ListeningPanel, id: string): void => {
  if (panel === 'speed') {
    player.setSpeed(Number(id));

    return;
  }

  if (panel === 'sleep') {
    player.setSleep(id === 'off' || id === 'endOfChapter' ? id : Number(id));

    return;
  }

  player.goToChapter(Number(id));
};

export { chooseListening };
