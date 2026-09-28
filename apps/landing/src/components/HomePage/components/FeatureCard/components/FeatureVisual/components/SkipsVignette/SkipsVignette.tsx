import { Pause as PauseIcon, SkipForward as SkipForwardIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { Swap } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/Swap/Swap';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

/**
 * An episode playing with its intro found; pointed at, the skip is pressed and the playhead jumps past the intro.
 */
const SkipsVignette = () => (
  <div className="valence-card-shell w-full max-w-[var(--vignette-width)] shadow-[var(--shadow-lifted)]">
    <div className="relative flex aspect-[16/9] flex-col justify-end overflow-hidden rounded-xl bg-linear-to-br from-accent/30 via-shade/80 to-shade p-2.5">
      <span
        className={cn(
          'absolute bottom-20 right-3',
          ACTING,
          'delay-300 acted:translate-y-2 acted:opacity-0',
        )}
      >
        <span className={cn('flex', ACTING, 'duration-150 acted:scale-95')}>
          <Button size="md" variant="secondary" className="px-4" onClick={nothing}>
            Skip Intro
            <Icon of={SkipForwardIcon} size={16} />
          </Button>
        </span>
      </span>

      <div className="valence-solid flex flex-col gap-1.5 rounded-lg px-3 py-2 text-text">
        <span className="flex items-center gap-3">
          <span className="relative h-1 min-w-0 flex-1 rounded-full bg-[var(--surface-hover)]">
            <span
              className={cn(
                'absolute inset-y-0 left-0 w-[7%] rounded-full bg-primary',
                ACTING,
                'delay-200 acted:w-[12%]',
              )}
            />
            <span className="absolute inset-y-0 left-[3%] w-[6%] rounded-full bg-text/25" />
          </span>
          <span className="shrink-0 text-xs tabular-nums">
            <Swap delay={200} className="justify-items-end" from="3:12" to="4:40" />
            <span className="text-text-muted"> / 41:08</span>
          </span>
        </span>
        <span className="flex items-center gap-2 text-xs text-text-muted">
          <Icon of={PauseIcon} size={14} tone="strong" />
          <span className="truncate">The Lantern Keepers · S2 E4 · Low Tide</span>
        </span>
      </div>
    </div>
  </div>
);

SkipsVignette.displayName = 'SkipsVignette';

export { SkipsVignette };
