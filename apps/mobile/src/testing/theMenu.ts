import { screen } from '@testing-library/react-native';

/**
 * The system pop-up menu drawn for a choice, found by what is being chosen, and a failure that says
 * so where there is no such menu.
 *
 * @param label - What the menu chooses, as `AChoiceMenu` was told.
 * @returns The menu as drawn.
 */
const theMenu = (label: string): NonNullable<typeof screen.root> => {
  const [menu] = screen.container.queryAll(
    (one) => one.props.label === label && 'selection' in one.props,
  );

  if (menu === undefined) {
    throw new Error(`No menu for ${label} was drawn.`);
  }

  return menu;
};

export { theMenu };
