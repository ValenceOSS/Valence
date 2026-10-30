import type { TvScreenProps } from './TvScreen.types';

/**
 * The television's screen in the room, cut exactly to the glass, which shows whatever it is given
 * — a picture now, a film later — filling the glass with a faint sheen and the edges falling dark.
 *
 * @param children - What is on the screen, sized to fill it.
 */
const TvScreen = ({ children }: TvScreenProps) => (
  <div className="absolute left-[27.78%] top-[24.28%] h-[41.08%] w-[43.75%] overflow-hidden bg-aurora">
    {children}
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,color-mix(in_oklab,var(--color-on-scrim)_7%,transparent)_0%,color-mix(in_oklab,var(--color-on-scrim)_2%,transparent)_38%,transparent_38.2%)] shadow-[inset_0_0_2.5vw_color-mix(in_oklab,var(--color-aurora)_55%,transparent)]"
    />
  </div>
);

TvScreen.displayName = 'TvScreen';

export { TvScreen };
