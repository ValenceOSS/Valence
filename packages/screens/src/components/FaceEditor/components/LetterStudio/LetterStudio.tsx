import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { LETTER_FONTS } from '@ValenceContracts/schemas/LetterFont';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { inkFor } from '@ValenceScreens/library/inkFor';
import { LETTER_FONT_LOOKS } from '@ValenceScreens/library/LETTER_FONT_LOOKS';
import type { LetterStudioProps } from './LetterStudio.types';

/**
 * The plainest face: the first letter of the name, the font it is set in, and the colour behind it.
 * Each font is shown setting that very letter, so the choice is made by eye rather than by name.
 *
 * @param name - Whose letter it is.
 * @param colour - The colour now.
 * @param font - The font now.
 * @param onColour - Told a different colour was chosen.
 * @param onFont - Told a different font was chosen.
 */
const LetterStudio = ({ name, colour, font, onColour, onFont }: LetterStudioProps) => (
  <div className="flex flex-col gap-8">
    <section className="flex flex-col gap-3">
      <h3 className="text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">Font</h3>
      <div className="grid grid-cols-4 gap-3">
        {LETTER_FONTS.map((option) => {
          const look = LETTER_FONT_LOOKS[option];

          return (
            <Button
              key={option}
              variant="bare"
              size="none"
              label={`Set it in ${look.name}`}
              hasTooltip={false}
              isActive={option === font}
              onClick={() => {
                onFont(option);
              }}
              className="group flex flex-col items-center gap-1.5"
            >
              <span
                style={{
                  backgroundColor: colour,
                  fontFamily: look.family,
                  fontWeight: look.weight,
                }}
                className={cn(
                  'flex size-16 items-center justify-center rounded-full text-2xl transition-transform group-hover:scale-105',
                  inkFor(colour) === 'dark' ? 'text-letter-dark' : 'text-letter-light',
                  option === font &&
                    'ring-2 ring-accent ring-offset-2 ring-offset-[var(--color-surface-raised)]',
                )}
              >
                {profileInitial(name)}
              </span>
              <span
                className={cn('text-[0.7rem]', option === font ? 'text-text' : 'text-text-muted')}
              >
                {look.name}
              </span>
            </Button>
          );
        })}
      </div>
    </section>

    <section className="flex flex-col gap-3">
      <h3 className="text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">Colour</h3>
      <ColourChoice label="Colour" value={colour} onChange={onColour} />
    </section>
  </div>
);

LetterStudio.displayName = 'LetterStudio';

export { LetterStudio };
