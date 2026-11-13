import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { ScrollRail } from '@ValenceUI/ScrollRail';
import { LETTER_FONTS } from '@ValenceContracts/schemas/LetterFont';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { swatchRing } from '@ValenceScreens/components/ColourChoice/swatchRing';
import { FaceChoice } from '@ValenceScreens/components/FaceEditor/components/FaceChoice/FaceChoice';
import { facePaint } from '@ValenceClient/profiles/facePaint';
import { PROFILE_GRADIENTS } from '@ValenceClient/profiles/PROFILE_GRADIENTS';
import { LETTER_FONT_LOOKS } from '@ValenceScreens/library/LETTER_FONT_LOOKS';
import { FaceLetter } from '@ValenceScreens/components/FaceLetter/FaceLetter';
import type { LetterStudioProps } from './LetterStudio.types';
import { say } from '@ValenceI18n/say';

/**
 * The plainest face: the first letter of the name, the font it is set in, and what is behind it. A
 * row that scrolls sideways shows each font setting that very letter, so the choice is made by eye
 * rather than by name; beneath it, one row holds the colours and then the gradients, each ending in
 * a swatch that opens a picker for any colour at all.
 *
 * @param name - Whose letter it is.
 * @param colour - The colour now, or where its gradient starts.
 * @param colourTo - Where the gradient ends, if the face has one.
 * @param font - The font now.
 * @param onColour - Told a different colour was chosen, which leaves the gradient behind.
 * @param onGradient - Told a gradient was chosen, by where it starts and ends.
 * @param onFont - Told a different font was chosen.
 */
const LetterStudio = ({
  name,
  colour,
  colourTo,
  font,
  onColour,
  onGradient,
  onFont,
}: LetterStudioProps) => {
  const paint = facePaint(colour, colourTo);
  const isReadyGradient = PROFILE_GRADIENTS.some(
    ({ from, to }) => from === colour && to === colourTo,
  );

  return (
    <div className="flex flex-col gap-4">
      <ScrollRail className="flex pb-1 pt-1.5">
        {LETTER_FONTS.map((option) => {
          const look = LETTER_FONT_LOOKS[option];

          return (
            <FaceChoice
              key={option}
              label={say('screens.faceEditor.letterStudio.setItInName', { name: look.name })}
              name={look.shortName ?? look.name}
              isChosen={option === font}
              onChoose={() => {
                onFont(option);
              }}
            >
              <span
                style={{ ...paint.style, fontFamily: look.family, fontWeight: look.weight }}
                className={cn(
                  'flex size-full items-center justify-center text-xl',
                  paint.ink === 'dark' ? 'text-letter-dark' : 'text-letter-light',
                )}
              >
                <FaceLetter
                  letter={profileInitial(name)}
                  family={look.family}
                  weight={look.weight}
                />
              </span>
            </FaceChoice>
          );
        })}
      </ScrollRail>

      <ScrollRail className="flex items-center gap-2.5 px-1.5 py-1.5">
        <ColourChoice
          label={say('common.colour')}
          value={colourTo === null ? colour : ''}
          onChange={onColour}
          className="shrink-0 flex-nowrap [&>*]:shrink-0"
        />

        <span aria-hidden className="mx-1.5 h-6 w-0.5 shrink-0 rounded-full bg-text/35" />

        {PROFILE_GRADIENTS.map(({ from, to, name: gradient }) => {
          const isChosen = colourTo !== null && from === colour && to === colourTo;

          return (
            <Button
              key={`${from}${to}`}
              variant="bare"
              size="none"
              label={say(gradient)}
              isActive={isChosen}
              style={facePaint(from, to).style}
              className={cn('size-8 shrink-0 rounded-full ring-1 ring-line', swatchRing(isChosen))}
              onClick={() => {
                onGradient(from, to);
              }}
            />
          );
        })}

        <ColourChoice
          label={say('screens.faceEditor.letterStudio.whereTheGradientEnds')}
          value={colourTo === null || isReadyGradient ? '' : colourTo}
          isCompact
          className="shrink-0"
          onChange={(to) => {
            onGradient(colour, to);
          }}
        />
      </ScrollRail>
    </div>
  );
};

LetterStudio.displayName = 'LetterStudio';

export { LetterStudio };
