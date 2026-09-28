import { ORBITAL } from '@ValenceUI/orbs/variants/ORBITAL';
import { MEADOW } from '@ValenceUI/orbs/variants/MEADOW';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { MockFace } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockFace/MockFace';

const FACES = [
  {
    name: 'Maya',
    orb: ORBITAL,
    tone: undefined,
    fan: 'acted:-translate-x-2 acted:-rotate-3',
    isPicked: false,
  },
  {
    name: 'Jonah',
    orb: undefined,
    tone: 'bg-success',
    fan: 'acted:-translate-x-1 acted:-translate-y-2',
    isPicked: true,
  },
  { name: 'Ruth', orb: MEADOW, tone: undefined, fan: 'acted:translate-x-1', isPicked: false },
  {
    name: 'Kids',
    orb: undefined,
    tone: 'bg-danger',
    fan: 'acted:translate-x-2 acted:rotate-3',
    isPicked: false,
  },
] as const;

/**
 * The household picker as the app opens on it; pointed at, the faces fan out and one of them is picked.
 */
const HouseholdVignette = () => (
  <div className="valence-float flex w-full max-w-[var(--vignette-width)] flex-col items-center gap-4 rounded-xl px-4 pb-5 pt-4">
    <span className="text-sm font-medium text-text">Who’s watching?</span>
    <span className="grid w-full grid-cols-4 gap-2">
      {FACES.map((face) => (
        <span
          key={face.name}
          className={cn(
            'flex min-w-0 flex-col items-center gap-2',
            ACTING,
            face.fan,
            face.isPicked ? '' : 'acted:opacity-50',
          )}
        >
          <span
            className={cn(
              'rounded-full ring-0 ring-accent ring-offset-2 ring-offset-surface-raised',
              ACTING,
              face.isPicked ? 'delay-200 acted:scale-110 acted:ring-2' : '',
            )}
          >
            <MockFace
              name={face.name}
              {...(face.orb === undefined ? {} : { orb: face.orb })}
              {...(face.tone === undefined ? {} : { tone: face.tone })}
              className="size-12 text-lg shadow-lg"
            />
          </span>
          <span className="text-xs text-text">{face.name}</span>
        </span>
      ))}
    </span>
  </div>
);

HouseholdVignette.displayName = 'HouseholdVignette';

export { HouseholdVignette };
