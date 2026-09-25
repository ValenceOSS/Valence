import { ActionSheetIOS } from 'react-native';
import { LISTENING_CHOICES } from '@ValenceClient/books/LISTENING_CHOICES';

/**
 * Offers when a book should stop by itself, in the system's action sheet: after so many minutes,
 * at the end of the chapter playing, or not at all where a timer is already set.
 *
 * @param isSet - Whether a timer is already set, which offers turning it off.
 * @param onChosen - Told what was chosen, unless somebody cancelled.
 */
const askWhenToSleep = (
  isSet: boolean,
  onChosen: (choice: 'off' | 'endOfChapter' | number) => void,
): void => {
  const choices: ('off' | 'endOfChapter' | number)[] = [
    ...(isSet ? ['off' as const] : []),
    ...LISTENING_CHOICES.sleepMinutes,
    'endOfChapter',
  ];

  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: 'Sleep timer',
      options: [
        ...choices.map((choice) =>
          choice === 'off'
            ? 'Turn off'
            : choice === 'endOfChapter'
              ? 'End of this chapter'
              : `${choice.toString()} minutes`,
        ),
        'Cancel',
      ],
      cancelButtonIndex: choices.length,
      ...(isSet ? { destructiveButtonIndex: 0 } : {}),
    },
    (picked) => {
      const choice = choices[picked];

      if (choice !== undefined) {
        onChosen(choice);
      }
    },
  );
};

export { askWhenToSleep };
