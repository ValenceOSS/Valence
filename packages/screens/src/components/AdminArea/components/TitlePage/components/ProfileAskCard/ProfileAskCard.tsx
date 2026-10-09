import { Button } from '@ValenceUI/Button';
import type { ProfileAskCardProps } from './ProfileAskCard.types';
import { say } from '@ValenceI18n/say';

/**
 * Where a title waits on the operator because somebody asked for it at a higher quality profile
 * than it is being fetched with: who asked for what, and switching to it or keeping what it has.
 *
 * @param ask - The later ask.
 * @param currentName - The profile it is being fetched with, where it has one.
 * @param isBusy - Whether a choice is being sent.
 * @param onDecide - Told which way it went.
 */
const ProfileAskCard = ({ ask, currentName, isBusy, onDecide }: ProfileAskCardProps) => {
  const asked = ask.profileName ?? say('common.aHigherProfile');
  const current = currentName ?? say('common.itsLibrarysProfile');

  return (
    <section
      aria-label={say('screens.adminArea.titlePage.profileAskCard.aHigherQualityAsk')}
      className="flex flex-col gap-3 rounded-2xl border border-[var(--surface-line)] bg-surface-raised p-5 sm:flex-row sm:items-center"
    >
      <p className="flex-1 text-sm text-text">
        {say('screens.adminArea.titlePage.profileAskCard.nameAskedForProfile', {
          name: ask.asker.name,
          asked,
          current,
        })}
      </p>

      <span className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          isLoading={isBusy}
          onClick={() => {
            onDecide('switch');
          }}
        >
          {say('screens.adminArea.titlePage.profileAskCard.switchToProfile', { profile: asked })}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={isBusy}
          onClick={() => {
            onDecide('keep');
          }}
        >
          {say('screens.adminArea.titlePage.profileAskCard.keepProfile', { profile: current })}
        </Button>
      </span>
    </section>
  );
};

ProfileAskCard.displayName = 'ProfileAskCard';

export { ProfileAskCard };
