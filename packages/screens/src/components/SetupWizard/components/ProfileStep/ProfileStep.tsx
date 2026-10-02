import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { SettingList } from '@ValenceUI/SettingList';
import { Spinner } from '@ValenceUI/Spinner';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { say } from '@ValenceI18n/say';
import { ProfileSettings } from '@ValenceScreens/components/ProfileSettings/ProfileSettings';
import type { ProfileDraft } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';
import { SetupStepFrame } from '@ValenceScreens/components/SetupWizard/components/SetupStepFrame/SetupStepFrame';
import { draftOfProfile } from '@ValenceScreens/profiles/draftOfProfile';
import { saveProfileDraft } from '@ValenceScreens/profiles/saveProfileDraft';
import type { ProfileStepProps } from './ProfileStep.types';

/**
 * The administrator's own profile, edited with the same editor their account offers: the name
 * everybody sees, their face and its colour, and how Valence looks and moves for them. It is saved
 * as they go on, to the very profile the account section edits later.
 *
 * @param onContinue - Told to go on, once it is saved.
 */
const ProfileStep = ({ onContinue }: ProfileStepProps) => {
  const cache = useQueryClient();
  const asked = useQuery(profileQueries.watching());
  const profile = asked.data ?? null;
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    setDraft((held) => held ?? (profile === null ? null : draftOfProfile(profile)));
  }, [profile]);

  const save = async () => {
    if (profile === null || draft === null) {
      onContinue();

      return;
    }

    setIsSaving(true);
    setProblem(null);

    const saved = await saveProfileDraft(profile, draft);

    setIsSaving(false);

    if (!saved) {
      setProblem(say('common.thoseChangesWereNotSaved'));

      return;
    }

    await cache.invalidateQueries({ queryKey: profileQueries.key });
    await cache.invalidateQueries({ queryKey: sessionQueries.key });
    onContinue();
  };

  return (
    <SetupStepFrame
      title={say('screens.setupWizard.profileStep.yourProfile')}
      lead={say('screens.setupWizard.profileStep.howYouAppearHere')}
      actions={
        <Button
          variant="confirm"
          size="lg"
          isLoading={isSaving}
          disabled={asked.isPending}
          onClick={() => {
            void save();
          }}
        >
          {say('common.continue')}
          <Icon of={ArrowRightIcon} size={16} />
        </Button>
      }
    >
      {asked.isPending ? (
        <Spinner size="sm" label={say('screens.setupWizard.profileStep.readingYourProfile')} />
      ) : (
        <SettingList>
          <ProfileSettings
            profile={profile}
            draft={draft}
            onDraft={(change) => {
              setDraft((held) => (held === null ? held : { ...held, ...change }));
            }}
          />
        </SettingList>
      )}

      {problem === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}
    </SetupStepFrame>
  );
};

ProfileStep.displayName = 'ProfileStep';

export { ProfileStep };
