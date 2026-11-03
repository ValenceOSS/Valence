import type { TintedGroundProps } from './TintedGround.types';

/**
 * The ground of a title's dialog, tinted with the colour of its artwork as the phone tints a title's
 * page: the picture fades into the tint, which runs on down the dialog and gives way to the dialog's
 * own glass towards its foot. Runs to the dialog's edges, keeping its content where it was, and
 * hands the tint on as `--title-tint` so the glass buttons laid over the artwork take it on too.
 *
 * @param tint - The colour, or nothing to leave the dialog as it is.
 * @param children - The dialog's content.
 */
const TintedGround = ({ tint, children }: TintedGroundProps) => (
  <div
    className="relative -m-3 p-3 sm:-m-4 sm:p-4"
    {...(tint === null
      ? {}
      : {
          style: {
            ...Object.fromEntries([['--title-tint', tint]]),
            backgroundImage: `linear-gradient(to bottom, ${tint} 0%, ${tint} 40%, transparent 100%)`,
          },
        })}
  >
    {children}
  </div>
);

TintedGround.displayName = 'TintedGround';

export { TintedGround };
