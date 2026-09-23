import { fireEvent, screen } from '@testing-library/react-native';
import { theChoicesIn } from '@ValencePhone/testing/theChoicesIn';

/**
 * Picks one of a row of choices, as somebody tapping it in the system's segmented control would.
 *
 * @param row - What the row is called, as it is labelled for anyone who cannot see it.
 * @param choice - The choice to pick, by its words.
 * @returns Once it has been picked.
 */
const chooseIn = async (row: string, choice: string): Promise<void> => {
  const index = theChoicesIn(row).indexOf(choice);

  if (index === -1) {
    throw new Error(`${row} offers no ${choice}.`);
  }

  await fireEvent(screen.getByLabelText(row), 'choose', { nativeEvent: { index } });
};

export { chooseIn };
