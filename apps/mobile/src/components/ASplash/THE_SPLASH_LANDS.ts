import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';

const THE_SPLASH_LANDS: { measure: (() => Promise<ARectOnScreen | null>) | null } = {
  measure: null,
};

export { THE_SPLASH_LANDS };
