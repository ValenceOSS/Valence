import { useTheChosenAppearance } from '@ValenceMobile/theme/useTheChosenAppearance';

/**
 * Keeps what the system draws for the app in the appearance somebody chose, from the moment the
 * phone knows what they chose. Draws nothing itself.
 */
const TheChosenAppearance = () => {
  useTheChosenAppearance();

  return null;
};

TheChosenAppearance.displayName = 'TheChosenAppearance';

export { TheChosenAppearance };
