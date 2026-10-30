import { fireEvent, screen } from '@testing-library/react-native';

/**
 * Presses one item of a menu that drops from what opened it, as somebody would once it is open.
 *
 * @param label - The item's words.
 */
const pickFromAMenu = async (label: string): Promise<void> => {
  const [item] = screen.container.queryAll(
    (one) => 'onButtonPress' in one.props && one.props.label === label,
  );

  if (item === undefined) {
    throw new Error(`No menu item ${label} was drawn.`);
  }

  await fireEvent(item, 'buttonPress');
};

export { pickFromAMenu };
