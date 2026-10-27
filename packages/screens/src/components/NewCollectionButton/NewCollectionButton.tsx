import { useState } from 'react';
import { Plus as PlusIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { JOINED_LOOKS } from '@ValenceUI/tokens/joinedLooks';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { CollectionEditDialog } from '@ValenceScreens/components/CollectionEditDialog/CollectionEditDialog';
import type { TitleRules } from '@ValenceContracts/schemas/SmartRules';
import type { NewCollectionButtonProps } from './NewCollectionButton.types';
import { say } from '@ValenceI18n/say';

const FILMS: TitleRules = { holds: 'films', rules: [], order: 'added', limit: null };

const SHOWS: TitleRules = { holds: 'series', rules: [], order: 'added', limit: null };

/**
 * Starts a new collection of films, or of programmes: a smart one for anybody where the server can
 * make them, and for somebody who looks after the libraries, either kind. Says nothing to somebody
 * who can make neither.
 *
 * @param holds - Whether a smart one starts out holding films or programmes.
 * @param onMade - Told which collection was made.
 */
const NewCollectionButton = ({ holds, onMade }: NewCollectionButtonProps) => {
  const { may } = useWhatIMayDo();
  const mayManage = may('library.edit');
  const canMakeSmart = useServerHas('library.smartLists') === true;
  const [isMaking, setIsMaking] = useState(false);

  if (!mayManage && !canMakeSmart) {
    return null;
  }

  return (
    <>
      <span className={JOINED_LOOKS.track}>
        <Button
          variant="bare"
          size="none"
          className={cn(JOINED_LOOKS.segment, 'inline-flex items-center')}
          onClick={() => {
            setIsMaking(true);
          }}
        >
          <Icon of={PlusIcon} size={16} />
          {say('common.newCollection')}
        </Button>
      </span>

      <CollectionEditDialog
        isOpen={isMaking}
        isSmart={!mayManage}
        letsChooseSmart={mayManage && canMakeSmart}
        startsWithRules={holds === 'film' ? FILMS : SHOWS}
        onClose={() => {
          setIsMaking(false);
        }}
        onSaved={onMade}
      />
    </>
  );
};

NewCollectionButton.displayName = 'NewCollectionButton';

export { NewCollectionButton };
