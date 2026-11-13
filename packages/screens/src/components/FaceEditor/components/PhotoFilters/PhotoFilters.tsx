import { FramedPicture } from '@ValenceUI/FramedPicture';
import { ScrollRail } from '@ValenceUI/ScrollRail';
import { PICTURE_ASPECTS } from '@ValenceContracts/constants/PICTURE_ASPECTS';
import { toneOfFilter } from '@ValenceContracts/functions/toneOfFilter';
import { PHOTO_FILTERS } from '@ValenceContracts/schemas/ViewerProfile';
import { FaceChoice } from '@ValenceScreens/components/FaceEditor/components/FaceChoice/FaceChoice';
import { PHOTO_FILTER_NAMES } from '@ValenceClient/profiles/PHOTO_FILTER_NAMES';
import type { PhotoFiltersProps } from './PhotoFilters.types';
import { say } from '@ValenceI18n/say';

/**
 * The filters a photograph can be drawn in, each shown as the photograph itself in its circle in
 * that filter, in a row that scrolls sideways.
 *
 * @param picture - Where the whole photograph is drawn from, or nothing until there is one, while
 *   each filter is an empty circle that cannot be chosen and the row is held still.
 * @param frame - Where it sits in its circle.
 * @param chosen - The filter it is drawn in now.
 * @param onChoose - Told a filter was chosen.
 */
const PhotoFilters = ({ picture, frame, chosen, onChoose }: PhotoFiltersProps) => (
  <ScrollRail className="flex pb-1 pt-1.5" isDisabled={picture === null}>
    {PHOTO_FILTERS.map((filter) => (
      <FaceChoice
        key={filter}
        label={say(PHOTO_FILTER_NAMES[filter])}
        name={say(PHOTO_FILTER_NAMES[filter])}
        isChosen={filter === chosen}
        isDisabled={picture === null}
        onChoose={() => {
          onChoose(filter);
        }}
      >
        {picture === null ? null : (
          <FramedPicture
            src={picture}
            frame={frame}
            aspect={PICTURE_ASPECTS.face}
            tone={toneOfFilter(filter)}
          />
        )}
      </FaceChoice>
    ))}
  </ScrollRail>
);

PhotoFilters.displayName = 'PhotoFilters';

export { PhotoFilters };
