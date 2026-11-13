import { useWindowDimensions } from 'react-native';

const OPENED_FROM = 600;

/**
 * Whether the app is on the open inside of a folding phone, where even the screen's shorter side is
 * wider than any phone held upright.
 *
 * @returns Whether it is opened out.
 */
const useIsOpenedOut = (): boolean => {
  const { width, height } = useWindowDimensions();

  return Math.min(width, height) >= OPENED_FROM;
};

export { OPENED_FROM, useIsOpenedOut };
