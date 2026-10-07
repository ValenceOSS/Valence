import { useWindowDimensions } from 'react-native';

/**
 * The screen the television's pages are laid out on: 1920 points across on tvOS, and on an Android
 * TV, which is made to match.
 *
 * @returns How wide and tall it is.
 */
const useTheScreen = (): { width: number; height: number } => {
  const { width, height } = useWindowDimensions();

  return { width, height };
};

export { useTheScreen };
