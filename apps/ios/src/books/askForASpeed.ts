import { ActionSheetIOS } from 'react-native';
import { LISTENING_CHOICES } from '@ValenceClient/books/LISTENING_CHOICES';

/**
 * Offers the speeds a book can be played at, in the system's action sheet, the one it plays at now
 * marked.
 *
 * @param now - How fast it plays now.
 * @param onChosen - Told the speed chosen, unless somebody cancelled.
 */
const askForASpeed = (now: number, onChosen: (speed: number) => void): void => {
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: 'Speed',
      options: [
        ...LISTENING_CHOICES.speeds.map(
          (speed) => `${speed.toString()}×${speed === now ? ' ✓' : ''}`,
        ),
        'Cancel',
      ],
      cancelButtonIndex: LISTENING_CHOICES.speeds.length,
    },
    (picked) => {
      const speed = LISTENING_CHOICES.speeds[picked];

      if (speed !== undefined) {
        onChosen(speed);
      }
    },
  );
};

export { askForASpeed };
