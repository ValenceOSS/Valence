import { Lock as LockIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { say } from '@ValenceI18n/say';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { ShowcaseFace } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ShowcaseFace/ShowcaseFace';

const FACES = [
  { name: 'Maya', hasPin: true, isPicked: false },
  { name: 'Jonah', hasPin: false, isPicked: true },
  { name: 'Ruth', hasPin: false, isPicked: false },
  { name: 'Kids', hasPin: false, isPicked: false },
] as const;

/**
 * The app's own who-is-watching faces, at the size the app draws them; pointed at, one of them
 * lifts as the app's faces do under a pointer and the others step back.
 */
const HouseholdPicture = () => (
  <div className="flex w-full flex-col items-center gap-8">
    <span className="flex flex-col items-center gap-1 text-center">
      <span className="text-3xl font-semibold tracking-[-0.04em] text-text">
        {say('common.whoIsWatching')}
      </span>
      <span className="text-sm text-text-muted">
        {say('screens.whoIsWatching.signedInAsAccount', { account: 'The Okafors' })}
      </span>
    </span>

    <span className="flex items-start justify-center gap-8">
      {FACES.map((face) => (
        <span
          key={face.name}
          className={cn(
            'flex w-24 shrink-0 flex-col items-center gap-3',
            ACTING,
            face.isPicked ? 'acted:-translate-y-2' : 'acted:opacity-40',
          )}
        >
          <span className="relative w-full">
            <ShowcaseFace name={face.name} isLifted className="aspect-square w-full text-4xl" />

            {face.hasPin ? (
              <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-surface-raised text-text-muted shadow">
                <Icon of={LockIcon} size={14} label={say('screens.whoIsWatching.hasAPin')} />
              </span>
            ) : null}
          </span>

          <span
            className={cn(
              'w-full truncate text-center text-sm text-text-muted',
              ACTING,
              face.isPicked ? 'acted:text-text' : '',
            )}
          >
            {face.name}
          </span>
        </span>
      ))}
    </span>
  </div>
);

HouseholdPicture.displayName = 'HouseholdPicture';

export { HouseholdPicture };
