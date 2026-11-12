import { RotateCcw as RotateCcwIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { say } from '@ValenceI18n/say';
import { glassOnArtwork } from './glassOnArtwork';
import type { PlayWithRestartProps } from './PlayWithRestart.types';

/**
 * A title's play button with, where somebody is part way through, a square beside it that starts it
 * again from the beginning, as the phone draws it: the two joined by a narrow gap where their inner
 * corners are squared off, the square lit faintly in the colour laid over the artwork. Anything more
 * to do with the title can be joined on at the end the same way, so play, start again and the rest
 * read as one split control.
 *
 * @param children - The play button itself.
 * @param onStartAgain - Told to play it from the start, where there is somewhere to carry on from.
 * @param more - Draws the square at the end, such as a menu of what else can be done, given the
 *   classes that shape it to the end of the control.
 * @param size - How large it is drawn: large under a title's artwork, smaller in a card.
 */
const PlayWithRestart = ({ children, onStartAgain, more, size = 'lg' }: PlayWithRestartProps) => {
  const square = cn(
    'flex shrink-0 items-center justify-center rounded-l-[4px]',
    size === 'lg' ? 'h-[3.25rem] w-14' : 'h-10 w-11',
    glassOnArtwork,
  );
  const end = size === 'lg' ? 'rounded-r-[0.875rem]' : 'rounded-r-[0.75rem]';
  const isJoined = onStartAgain !== undefined || more !== undefined;

  return (
    <div className="flex w-full items-stretch gap-[3px]">
      <div
        className={cn('min-w-0 flex-1 [&>*]:w-full', isJoined ? '[&_button]:rounded-r-[4px]' : '')}
      >
        {children}
      </div>

      {onStartAgain === undefined ? null : (
        <Button
          variant="ghost"
          size="none"
          label={say('common.startAgain')}
          className={cn(square, more === undefined ? end : 'rounded-r-[4px]')}
          onClick={onStartAgain}
        >
          <Icon of={RotateCcwIcon} size={size === 'lg' ? 20 : 17} />
        </Button>
      )}

      {more?.(cn(square, end))}
    </div>
  );
};

PlayWithRestart.displayName = 'PlayWithRestart';

export { PlayWithRestart };
