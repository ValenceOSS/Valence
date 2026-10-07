import { cn } from '@ValenceUI/cn';
import { DuoFrame } from '@ValenceLanding/components/HomePage/components/DuoShowcase/components/DuoFrame/DuoFrame';
import type { OpenHalfProps } from './OpenHalf.types';

/**
 * One half of the opened Duo, cut at the hinge: the whole picture laid out at twice the half's width
 * and slid across so only its own side shows, with a still of the screen set into it.
 *
 * @param side - Which half it is.
 * @param open - The opened Duo's picture and where its screen sits.
 * @param still - What its screen shows.
 */
const OpenHalf = ({ side, open, still }: OpenHalfProps) => (
  <div className="absolute inset-0 overflow-hidden">
    <div className={cn('absolute inset-y-0 w-[200%]', side === 'left' ? 'left-0' : '-left-full')}>
      <DuoFrame
        frame={open.frame}
        width={open.width}
        height={open.height}
        screen={open.screen}
        className="w-full"
      >
        <img src={still} alt="" draggable={false} className="h-full w-full object-cover" />
      </DuoFrame>
    </div>
  </div>
);

OpenHalf.displayName = 'OpenHalf';

export { OpenHalf };
