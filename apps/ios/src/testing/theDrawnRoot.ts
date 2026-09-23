import { screen } from '@testing-library/react-native';

/**
 * The outermost thing drawn on screen, for a test that needs to press or inspect it directly, and a
 * failure that says so rather than a null where nothing was drawn.
 *
 * @returns What was drawn.
 */
const theDrawnRoot = (): NonNullable<typeof screen.root> => {
  const root = screen.root;

  if (root === null) {
    throw new Error('Nothing was drawn.');
  }

  return root;
};

export { theDrawnRoot };
