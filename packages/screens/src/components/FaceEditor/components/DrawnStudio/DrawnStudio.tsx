import { Shuffle as ShuffleIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { AVATAR_STYLES } from '@ValenceContracts/schemas/ViewerProfile';
import type { DrawnStudioProps } from './DrawnStudio.types';

const STYLE_NAMES: Record<(typeof AVATAR_STYLES)[number], string> = {
  adventurer: 'Adventurer',
  lorelei: 'Lorelei',
  notionists: 'Notionists',
  bottts: 'Bottts',
  funEmoji: 'Fun emoji',
  thumbs: 'Thumbs',
};

/**
 * A drawn face: which style it is drawn in, and a shuffle that draws a different face in that
 * style each time it is pressed.
 *
 * @param style - The style chosen now.
 * @param seed - What the face in that style is drawn from.
 * @param onChange - Told the style or the face changed.
 */
const DrawnStudio = ({ style, seed, onChange }: DrawnStudioProps) => (
  <div className="flex flex-col gap-8">
    <section className="flex flex-col gap-3">
      <h3 className="text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">Style</h3>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {AVATAR_STYLES.map((one) => (
          <Button
            key={one}
            variant="bare"
            size="none"
            label={`Draw it in the ${STYLE_NAMES[one]} style`}
            hasTooltip={false}
            isActive={one === style}
            onClick={() => {
              onChange({ style: one, seed });
            }}
            className="group flex flex-col items-center gap-1.5"
          >
            <img
              src={`/api/profiles/avatars/${one}?seed=${encodeURIComponent(seed)}`}
              alt=""
              className={cn(
                'size-16 rounded-xl bg-subtle transition-transform group-hover:scale-105',
                one === style &&
                  'ring-2 ring-accent ring-offset-2 ring-offset-[var(--color-surface-raised)]',
              )}
            />
            <span className={cn('text-[0.7rem]', one === style ? 'text-text' : 'text-text-muted')}>
              {STYLE_NAMES[one]}
            </span>
          </Button>
        ))}
      </div>
    </section>

    <div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          onChange({ style, seed: crypto.randomUUID().slice(0, 12) });
        }}
      >
        <Icon of={ShuffleIcon} size={15} />
        Another face
      </Button>
    </div>
  </div>
);

DrawnStudio.displayName = 'DrawnStudio';

export { DrawnStudio };
