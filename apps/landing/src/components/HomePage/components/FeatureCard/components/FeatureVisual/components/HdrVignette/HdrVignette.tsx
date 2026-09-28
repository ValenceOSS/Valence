import { Badge } from '@ValenceUI/Badge';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';

const SCENE = [
  'absolute inset-0 bg-linear-to-b from-accent/70 via-danger/50 to-highlight',
  'absolute left-[54%] top-[30%] aspect-square h-[28%] rounded-full bg-on-scrim shadow-[0_0_48px_18px_var(--color-highlight)]',
  'absolute inset-x-0 bottom-[22%] h-[34%] bg-shade/85 [clip-path:polygon(0_70%,12%_40%,24%_58%,38%_18%,52%_52%,66%_30%,80%_56%,92%_36%,100%_48%,100%_100%,0_100%)]',
  'absolute inset-x-0 bottom-0 h-[26%] bg-shade',
] as const;

/**
 * One scene at dusk with its highlights clipped flat on one side and kept on the other; pointed at, the line between them sweeps across to show the kept version.
 */
const HdrVignette = () => (
  <div className="valence-card-shell w-full max-w-[var(--vignette-width)] shadow-[var(--shadow-lifted)]">
    <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
      {SCENE.map((layer) => (
        <span key={layer} className={layer} />
      ))}

      <span
        className={cn(
          'absolute inset-0 [clip-path:inset(0_50%_0_0)] saturate-[0.35] contrast-[0.7] brightness-[1.15]',
          ACTING,
          'duration-700 acted:[clip-path:inset(0_88%_0_0)]',
        )}
      >
        {SCENE.map((layer) => (
          <span key={layer} className={layer} />
        ))}
      </span>

      <span
        className={cn(
          'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-on-scrim/80',
          ACTING,
          'duration-700 acted:left-[12%]',
        )}
      />

      <span className="absolute left-2.5 top-2.5 flex gap-1">
        <Badge size="sm" tone="outline" className="text-on-scrim">
          SDR
        </Badge>
      </span>
      <span className="absolute right-2.5 top-2.5 flex gap-1 text-on-scrim">
        <Badge size="sm" tone="outline" className="text-on-scrim">
          4K
        </Badge>
        <Badge size="sm" tone="outline" className="text-on-scrim">
          HDR10
        </Badge>
      </span>
    </div>
  </div>
);

HdrVignette.displayName = 'HdrVignette';

export { HdrVignette };
