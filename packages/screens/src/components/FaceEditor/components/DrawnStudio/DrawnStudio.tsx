import { useState } from 'react';
import { drawingToShow } from '@ValenceClient/profiles/drawingToShow';
import { useSettledValue } from '@ValenceClient/profiles/useSettledValue';

const SETTLES_AFTER = 250;
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { Shuffle as ShuffleIcon } from '@keyline-icons/react';
import { AVATAR_STYLE_NAMES } from '@ValenceClient/profiles/AVATAR_STYLE_NAMES';
import { Icon } from '@ValenceUI/Icon';
import { ScrollRail } from '@ValenceUI/ScrollRail';
import { AVATAR_STYLES } from '@ValenceContracts/schemas/ViewerProfile';
import { FaceChoice } from '@ValenceScreens/components/FaceEditor/components/FaceChoice/FaceChoice';
import type { DrawnStudioProps } from './DrawnStudio.types';
import { say } from '@ValenceI18n/say';
import { randomId } from '@ValenceClient/platform/randomId';

/**
 * A drawn face of one’s own: a row that scrolls sideways of a way to draw it afresh at random, then
 * the styles to draw it in, each shown as the face itself, and beneath it what is behind it: nothing,
 * or a colour. The shuffle spins round once each time it is pressed, so a new face is seen to have been drawn.
 *
 * @param style - The style it is drawn in.
 * @param seed - What picks this face among all of that style's.
 * @param colour - The profile's colour, behind the face where it is drawn on it.
 * @param isOnColour - Whether the face is drawn on that colour, rather than clear.
 * @param onChange - Told the style or the face changed.
 * @param onColour - Told a colour was chosen to draw the face on.
 * @param onClear - Told the face is to be drawn clear.
 */
const DrawnStudio = ({
  style,
  seed,
  colour,
  isOnColour,
  onChange,
  onColour,
  onClear,
}: DrawnStudioProps) => {
  const [turns, setTurns] = useState(0);
  const settledColour = useSettledValue(colour, SETTLES_AFTER);

  return (
    <div className="flex flex-col gap-4">
      <ScrollRail className="flex pb-1 pt-1.5">
        <FaceChoice
          label={say('screens.faceEditor.drawnStudio.randomise')}
          name={say('screens.faceEditor.drawnStudio.randomise')}
          isChosen={false}
          onChoose={() => {
            setTurns((was) => was + 1);
            onChange({ style, seed: randomId().slice(0, 12) });
          }}
        >
          <span
            style={{ transform: `rotate(${(turns * 360).toString()}deg)` }}
            className="flex size-full items-center justify-center text-text transition-transform duration-500 ease-out still:transition-none"
          >
            <Icon of={ShuffleIcon} size={18} />
          </span>
        </FaceChoice>
        {AVATAR_STYLES.map((one) => (
          <FaceChoice
            key={one}
            label={say('screens.faceEditor.drawnStudio.drawItInTheSTYLENAMES', {
              STYLE_NAMES: AVATAR_STYLE_NAMES[one],
            })}
            name={AVATAR_STYLE_NAMES[one]}
            isChosen={one === style}
            onChoose={() => {
              onChange({ style: one, seed });
            }}
          >
            <img
              src={drawingToShow(one, seed, isOnColour ? settledColour : null)}
              alt=""
              style={isOnColour ? { backgroundColor: colour } : undefined}
              className="size-full object-cover"
            />
          </FaceChoice>
        ))}
      </ScrollRail>

      <ScrollRail className="flex">
        <ColourChoice
          label={say('common.colour')}
          value={isOnColour ? colour : ''}
          onChange={onColour}
          clear={{ isChosen: !isOnColour, onChoose: onClear }}
          className="flex-nowrap px-1.5 py-1.5 [&>*]:shrink-0"
        />
      </ScrollRail>
    </div>
  );
};

DrawnStudio.displayName = 'DrawnStudio';

export { DrawnStudio };
