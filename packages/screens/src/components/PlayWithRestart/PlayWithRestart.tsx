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
 * corners are squared off, the square lit faintly in the colour laid over the artwork.
 *
 * @param children - The play button itself.
 * @param onStartAgain - Told to play it from the start, where there is somewhere to carry on from.
 * @param size - How large it is drawn: large under a title's artwork, smaller in a card.
 */
const PlayWithRestart = ({ children, onStartAgain, size = 'lg' }: PlayWithRestartProps) => (
  <div className="flex w-full items-stretch gap-[3px]">
    <div
      className={cn(
        'min-w-0 flex-1 [&>*]:w-full',
        onStartAgain === undefined ? '' : '[&_button]:rounded-r-[4px]',
      )}
    >
      {children}
    </div>

    {onStartAgain === undefined ? null : (
      <Button
        variant="ghost"
        size="none"
        label={say('common.startAgain')}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-l-[4px]',
          size === 'lg' ? 'h-[3.25rem] w-14 rounded-r-[0.875rem]' : 'h-10 w-11 rounded-r-[0.75rem]',
          glassOnArtwork,
        )}
        onClick={onStartAgain}
      >
        <Icon of={RotateCcwIcon} size={size === 'lg' ? 20 : 17} />
      </Button>
    )}
  </div>
);

PlayWithRestart.displayName = 'PlayWithRestart';

export { PlayWithRestart };
