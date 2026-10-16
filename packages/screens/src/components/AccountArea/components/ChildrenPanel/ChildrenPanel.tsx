import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { ChildRow } from '@ValenceScreens/components/AccountArea/components/ChildrenPanel/components/ChildRow/ChildRow';
import { childQueries } from '@ValenceClient/query/childQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { addChild } from '@ValenceClient/account/fetchChildren';
import { CHILD_PIN } from '@ValenceContracts/schemas/ChildAccount';
import { say } from '@ValenceI18n/say';

/**
 * The children's accounts somebody looks after: adding one, and for each the PIN they sign in with
 * and what they may watch.
 *
 * A child picks their face on the way in and is through with a tap, or after a PIN where one is set,
 * so a household can let a child in without handing them a password they would only forget.
 */
const ChildrenPanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(childQueries.all());
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const isPinFine = pin === '' || CHILD_PIN.test(pin);

  const add = async () => {
    setIsAdding(true);

    const refused = await addChild(name.trim(), pin === '' ? null : pin);

    setIsAdding(false);

    if (refused !== null) {
      notify.failed(refused.message);

      return;
    }

    setName('');
    setPin('');
    await cache.invalidateQueries({ queryKey: childQueries.key });
    await cache.invalidateQueries({ queryKey: profileQueries.key });
  };

  return (
    <PanelCard title={say('screens.accountArea.childrenPanel.children')}>
      <div className="flex flex-col gap-6">
        <p className="text-sm text-text-muted">
          {say('screens.accountArea.childrenPanel.aChildPicksTheirFace')}
        </p>

        {asked.isError ? (
          <CouldNotRead
            said={say('screens.accountArea.childrenPanel.yourChildrenCouldNotBeRead')}
            isTryingAgain={asked.isFetching}
            onTryAgain={() => {
              void asked.refetch();
            }}
          />
        ) : asked.isPending ? (
          <Spinner
            isCentered
            label={say('screens.accountArea.childrenPanel.readingYourChildren')}
            size="sm"
          />
        ) : asked.data.length === 0 ? (
          <p className="text-sm text-text-muted">
            {say('screens.accountArea.childrenPanel.youHaveNoChildrenYet')}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {asked.data.map((child) => (
              <ChildRow key={child.id} child={child} />
            ))}
          </ul>
        )}

        <form
          noValidate
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <p className="text-sm font-medium text-text">
            {say('screens.accountArea.childrenPanel.addAChild')}
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <TextField
              label={say('common.name')}
              value={name}
              onValueChange={setName}
              className="min-w-48 flex-1"
            />

            <TextField
              label={say('screens.accountArea.childrenPanel.pinIfAny')}
              type="password"
              value={pin}
              onValueChange={setPin}
              autoComplete="off"
              className="w-40"
              {...(isPinFine
                ? {}
                : { error: say('screens.accountArea.childrenPanel.fourToEightDigits') })}
            />

            <Button
              type="submit"
              variant="confirm"
              isLoading={isAdding}
              disabled={name.trim() === '' || !isPinFine}
            >
              {say('screens.accountArea.childrenPanel.addChild')}
            </Button>
          </div>
        </form>
      </div>
    </PanelCard>
  );
};

ChildrenPanel.displayName = 'ChildrenPanel';

export { ChildrenPanel };
