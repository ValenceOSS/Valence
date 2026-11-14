import { BackdropScrim } from '@ValenceUI/BackdropScrim';
import type { TitleHeroProps } from './TitleHero.types';

const FADES_OUT = '[mask-image:linear-gradient(to_bottom,black_0%,black_70%,transparent_100%)]';

/**
 * The head of a title's dialog: the backdrop running to the dialog's edges, fading out into the
 * glass below it rather than into any one colour, since the glass has none, with what the title is
 * and what can be done with it laid over its foot.
 *
 * The picture is darkened behind what is laid over it whatever the theme, since lettering is
 * almost always white and a light picture would otherwise swallow it.
 *
 * @param preview - The backdrop, or the clip playing over it.
 * @param children - What is laid over its foot: the lettering, the facts and the controls.
 * @param lead - What sits in its top left corner, such as going back.
 * @param corner - What sits in its top right corner where the picture has no controls of its own
 *   to sit beside, such as closing it.
 * @param ref - The head itself, for scrolling back up to.
 */
const TitleHero = ({ preview, children, lead, corner, ref }: TitleHeroProps) => (
  <div ref={ref} className="relative -mx-3 -mt-3 sm:-mx-4 sm:-mt-4">
    <div className={`relative h-[clamp(22rem,58vh,34rem)] ${FADES_OUT}`}>
      {preview}
      <BackdropScrim />
    </div>

    {lead === undefined ? null : (
      <div className="absolute start-4 top-4 sm:start-6 sm:top-6">{lead}</div>
    )}

    {corner === undefined ? null : (
      <div className="absolute end-4 top-4 sm:end-6 sm:top-6">{corner}</div>
    )}

    <div className="absolute inset-x-0 bottom-0 px-4 pb-10 sm:px-6 sm:pb-14">{children}</div>
  </div>
);

TitleHero.displayName = 'TitleHero';

export { TitleHero };
