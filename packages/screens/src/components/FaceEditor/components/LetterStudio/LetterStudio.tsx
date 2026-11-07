import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { LETTER_FONTS } from '@ValenceContracts/schemas/LetterFont';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { facePaint } from '@ValenceClient/profiles/facePaint';
import { PROFILE_GRADIENTS } from '@ValenceClient/profiles/PROFILE_GRADIENTS';
import { LETTER_FONT_LOOKS } from '@ValenceScreens/library/LETTER_FONT_LOOKS';
import type { LetterStudioProps } from './LetterStudio.types';
import { say } from '@ValenceI18n/say';

/**
 * The plainest face: the first letter of the name, the font it is set in, and the colour behind it.
 * Each font is shown setting that very letter, so the choice is made by eye rather than by name.
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

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h3 className="text-[0.65rem] font-medium text-text-muted">{say('common.font')}</h3>
        <div className="grid grid-cols-4 gap-3">
          {LETTER_FONTS.map((option) => {
            const look = LETTER_FONT_LOOKS[option];

            return (
              <Button
                key={option}
                variant="bare"
                size="none"
                label={say('screens.faceEditor.letterStudio.setItInName', { name: look.name })}
                hasTooltip={false}
                isActive={option === font}
                onClick={() => {
                  onFont(option);
                }}
                className="group flex flex-col items-center gap-1.5"
              >
                <span
                  style={{
                    ...paint.style,
                    fontFamily: look.family,
                    fontWeight: look.weight,
                  }}
                  className={cn(
                    'flex size-16 items-center justify-center rounded-full text-2xl transition-transform group-hover:scale-105',
                    paint.ink === 'dark' ? 'text-letter-dark' : 'text-letter-light',
                    option === font &&
                      'ring-2 ring-primary ring-offset-2 ring-offset-[var(--color-surface-raised)]',
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
        <h3 className="text-[0.65rem] font-medium text-text-muted">{say('common.colour')}</h3>
        <ColourChoice
          label={say('common.colour')}
          value={colourTo === null ? colour : ''}
          onChange={onColour}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[0.65rem] font-medium text-text-muted">
          {say('screens.faceEditor.letterStudio.gradient')}
        </h3>
        <div className="flex flex-wrap items-center gap-2.5">
          {PROFILE_GRADIENTS.map(([from, to]) => {
            const isChosen = colourTo !== null && from === colour && to === colourTo;

            return (
              <Button
                key={`${from}${to}`}
                variant="bare"
                size="none"
                label={say('screens.faceEditor.letterStudio.useTheGradientFromTo', { from, to })}
                isActive={isChosen}
                style={facePaint(from, to).style}
                className={cn(
                  'size-8 rounded-full ring-1 ring-line transition-transform',
                  isChosen
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-[var(--color-surface-raised)]'
                    : 'hover-hover:hover:scale-110',
                )}
                onClick={() => {
                  onGradient(from, to);
                }}
              />
            );
          })}

          <ColourChoice
            label={say('screens.faceEditor.letterStudio.whereTheGradientEnds')}
            value={colourTo ?? ''}
            isCompact
            onChange={(to) => {
              onGradient(colour, to);
            }}
          />
        </div>
      </section>
    </div>
  );
};

LetterStudio.displayName = 'LetterStudio';

export { LetterStudio };
