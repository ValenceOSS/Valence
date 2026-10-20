import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { saveHousehold } from '@ValenceClient/household/fetchHousehold';
import { householdQueries } from '@ValenceClient/query/householdQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { HouseholdFace } from '@ValenceScreens/components/HouseholdFace/HouseholdFace';
import { say } from '@ValenceI18n/say';
import type { HouseholdRequest } from '@ValenceContracts/schemas/Household';
import { AccountPictureDialog } from './components/AccountPictureDialog/AccountPictureDialog';
import type { AccountFaceCardProps } from './AccountFaceCard.types';

/**
 * How an account several people watch on appears to everybody else — its name and picture — which
 * follow the owner's profile until the owner gives the account its own, and go back to following it
 * when cleared.
 *
 * @param ownerId - The owner profile, which the account's drawn faces are drawn from.
 * @param ownerName - The owner profile's name, which the account goes by until it has its own.
 */
const AccountFaceCard = ({ ownerId, ownerName }: AccountFaceCardProps) => {
  const cache = useQueryClient();
  const asked = useQuery(householdQueries.onboarding());
  const household = asked.data?.household ?? null;
  const [name, setName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  if (household === null) {
    return <Spinner size="sm" label={say('common.loading')} />;
  }

  const typed = name ?? (household.hasOwnName === true ? household.name : '');
  const isNameChanged = typed.trim() !== (household.hasOwnName === true ? household.name : '');

  const readAgain = async (): Promise<void> => {
    await cache.invalidateQueries({ queryKey: householdQueries.key });
    await cache.invalidateQueries({ queryKey: sessionQueries.key });
  };

  const change = async (request: HouseholdRequest): Promise<void> => {
    setIsSaving(true);

    const saved = await saveHousehold(request);

    setIsSaving(false);

    if (saved === null) {
      notify.failed(say('common.thoseChangesWereNotSaved'));

      return;
    }

    setName(null);
    await readAgain();
  };

  return (
    <PanelCard title={say('common.account')} isFlush>
      <SettingList isInset>
        <SettingRow
          title={say('common.name')}
          description={
            household.hasOwnName === true
              ? say('screens.accountFaceCard.showsInsteadOfYourProfileName')
              : say('screens.accountFaceCard.showsOnTheSignInScreen', { name: ownerName })
          }
        >
          <form
            noValidate
            className="flex flex-wrap items-start gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void change({ name: typed.trim() === '' ? null : typed.trim() });
            }}
          >
            <TextField
              label={say('common.name')}
              isLabelHidden
              value={typed}
              placeholder={ownerName}
              onValueChange={setName}
              className="min-w-0 flex-1"
            />

            <Button
              type="submit"
              variant="secondary"
              isLoading={isSaving}
              disabled={!isNameChanged}
            >
              {say('common.save')}
            </Button>

            {household.hasOwnName === true ? (
              <Button
                variant="ghost"
                isLoading={isSaving}
                onClick={() => {
                  void change({ name: null });
                }}
              >
                {say('screens.accountFaceCard.useMyProfileName')}
              </Button>
            ) : null}
          </form>
        </SettingRow>

        <SettingRow
          title={say('common.picture')}
          description={
            household.hasOwnPicture === true
              ? say('screens.accountFaceCard.showsInsteadOfYourProfilePicture')
              : say('screens.accountFaceCard.usesYourProfilePicture')
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <HouseholdFace household={household} className="size-10 shrink-0 text-sm" />

            <Button
              variant="secondary"
              onClick={() => {
                setIsPicking(true);
              }}
            >
              <Icon of={ImageIcon} size={16} />
              {say('common.chooseAPicture')}
            </Button>

            {household.hasOwnPicture === true ? (
              <Button
                variant="ghost"
                isLoading={isSaving}
                onClick={() => {
                  void change({ avatar: null });
                }}
              >
                {say('screens.accountFaceCard.useMyProfilePicture')}
              </Button>
            ) : null}
          </div>
        </SettingRow>
      </SettingList>

      <AccountPictureDialog
        isOpen={isPicking}
        seed={ownerId}
        household={household}
        onClose={() => {
          setIsPicking(false);
        }}
        onSaved={() => {
          setIsPicking(false);
          void readAgain();
        }}
      />
    </PanelCard>
  );
};

AccountFaceCard.displayName = 'AccountFaceCard';

export { AccountFaceCard };
