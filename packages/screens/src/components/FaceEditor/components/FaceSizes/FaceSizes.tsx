import { FaceCircle } from '@ValenceScreens/components/FaceCircle/FaceCircle';
import type { FaceSizesProps } from './FaceSizes.types';
import { say } from '@ValenceI18n/say';

/**
 * A preview of the face being made at each size Valence draws faces — a tile on the screen that asks
 * who is watching, a row in a list, and the corner of the bar — so a detail that only works large is
 * caught before it is chosen.
 *
 * @param name - Whose face, for the initial and the row in a list.
 * @param colour - The colour behind an initial.
 * @param avatar - The face as it stands in the editor.
 * @param source - Where the saved picture is served from.
 * @param pending - A picture chosen here and not saved yet.
 */
const FaceSizes = ({ name, colour, avatar, source, pending }: FaceSizesProps) => {
  const face = { name, colour, avatar, source, pending };

  return (
    <div className="flex w-full flex-col gap-2.5">
      <p className="text-[0.65rem] font-medium text-text-muted">
        {say('screens.adminArea.mediaTitlePage.showInTheApp')}
      </p>

      <div className="flex items-center justify-center gap-8">
        <FaceCircle {...face} shape="tile" className="size-12 text-lg" />

        <div className="flex items-center gap-2 rounded-full bg-subtle py-1 pl-1 pr-3">
          <FaceCircle {...face} className="size-7 text-[0.65rem]" />
          <span className="max-w-24 truncate text-xs text-text">{name}</span>
        </div>

        <FaceCircle {...face} className="size-9 text-xs ring-2 ring-line" />
      </div>
    </div>
  );
};

FaceSizes.displayName = 'FaceSizes';

export { FaceSizes };
