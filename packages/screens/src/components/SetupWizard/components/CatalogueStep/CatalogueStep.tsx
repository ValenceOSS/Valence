import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight as ArrowRightIcon,
  CircleCheck as CircleCheckIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { saveCatalogueKey } from '@ValenceClient/admin/fetchAdmin';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { say } from '@ValenceI18n/say';
import { Sentence } from '@ValenceScreens/components/Sentence/Sentence';
import { SetupStepFrame } from '@ValenceScreens/components/SetupWizard/components/SetupStepFrame/SetupStepFrame';
import type { CatalogueStepProps } from './CatalogueStep.types';

const CATALOGUE_KEY_PAGE = 'https://www.themoviedb.org/settings/api';

/**
 * The key titles, artwork, years and ratings are looked up with. Without one a library is a list of
 * file names, so it is asked for before the first library is read; a key the server was started
 * with already counts, and it can be left for later.
 *
 * @param onBack - Told to go back to the household.
 * @param onSaved - Told once a key is saved, or one was there already.
 * @param onSkip - Told to go on without one.
 */
const CatalogueStep = ({ onBack, onSaved, onSkip }: CatalogueStepProps) => {
  const cache = useQueryClient();
  const overview = useQuery(adminQueries.overview());
  const [key, setKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const hasKey = overview.data?.settings.hasCatalogueKey === true;

  const save = async () => {
    setIsSaving(true);
    setProblem(null);

    const saved = await saveCatalogueKey(key.trim());

    setIsSaving(false);

    if (!saved) {
      setProblem(say('screens.adminArea.settingsPanel.theCatalogueKeyCouldNotBe'));

      return;
    }

    await cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
    onSaved();
  };

  return (
    <SetupStepFrame
      title={say('screens.setupWizard.catalogueStep.titlesAndArtwork')}
      lead={say('screens.setupWizard.catalogueStep.valenceLooksTitlesUpInTmdb')}
      back={
        <Button variant="ghost" onClick={onBack}>
          {say('common.back')}
        </Button>
      }
      actions={
        hasKey ? (
          <Button variant="confirm" size="lg" onClick={onSaved}>
            {say('common.continue')}
            <Icon of={ArrowRightIcon} size={16} />
          </Button>
        ) : (
          <>
            <Button variant="ghost" disabled={isSaving} onClick={onSkip}>
              {say('screens.setupWizard.skipForNow')}
            </Button>

            <Button
              variant="confirm"
              size="lg"
              isLoading={isSaving}
              disabled={key.trim() === ''}
              onClick={() => {
                void save();
              }}
            >
              {say('screens.setupWizard.catalogueStep.saveAndContinue')}
              <Icon of={ArrowRightIcon} size={16} />
            </Button>
          </>
        )
      }
    >
      {overview.isPending ? (
        <Spinner size="sm" label={say('screens.setupWizard.catalogueStep.checkingForAKey')} />
      ) : hasKey ? (
        <Callout
          icon={CircleCheckIcon}
          title={say('screens.setupWizard.catalogueStep.aKeyIsAlreadySet')}
        >
          {say('screens.setupWizard.catalogueStep.itCanBeChangedInSettings')}
        </Callout>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();

            if (key.trim() !== '') {
              void save();
            }
          }}
        >
          <TextField
            label={say('screens.adminArea.settingsPanel.catalogueKey')}
            type="password"
            value={key}
            onValueChange={setKey}
            placeholder={say('screens.adminArea.settingsPanel.pasteAKey')}
            autoComplete="off"
            descriptionPlacement="below"
            {...(problem === null ? {} : { error: problem })}
          />

          <p className="text-sm leading-relaxed text-text-muted">
            <Sentence
              words="screens.setupWizard.catalogueStep.getAFreeKeyFromTmdb"
              fillings={{
                link: <Link href={CATALOGUE_KEY_PAGE}>{say('common.getAFreeKey')}</Link>,
              }}
            />
          </p>
        </form>
      )}
    </SetupStepFrame>
  );
};

CatalogueStep.displayName = 'CatalogueStep';

export { CatalogueStep };
