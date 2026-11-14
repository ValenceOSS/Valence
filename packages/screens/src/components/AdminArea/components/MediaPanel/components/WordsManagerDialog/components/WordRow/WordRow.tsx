import { useState } from 'react';
import { X as XIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import type { WordRowProps } from './WordRow.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * One genre or tag of a library in the genres and tags dialog: its name, edited in place and renamed
 * on every title when asked, how many titles carry it, and a way to take it off them all.
 *
 * @param word - The genre or tag.
 * @param count - How many titles carry it.
 * @param isBusy - Whether a change to it is being saved.
 * @param onRename - Told the new name it is to have.
 * @param onRemove - Told it is to be taken off every title.
 */
const WordRow = ({ word, count, isBusy, onRename, onRemove }: WordRowProps) => {
  const [name, setName] = useState(word);
  const isRenamed = name.trim() !== '' && name.trim() !== word;
  const rename = () => {
    if (isRenamed) {
      onRename(name.trim());
    }
  };

  return (
    <li className="flex items-center gap-2 py-1.5">
      <TextField
        label={say('screens.adminArea.wordsManager.renameWord', { word })}
        isLabelHidden
        size="sm"
        value={name}
        onValueChange={setName}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            rename();
          }
        }}
        className="min-w-0 flex-1"
      />
      <span className="w-20 shrink-0 text-end font-body text-xs tabular-nums text-text-muted">
        {sayCount('common.count.titles', count)}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={!isRenamed}
        isLoading={isBusy}
        onClick={rename}
      >
        {say('common.rename')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        label={say('screens.adminArea.wordsManager.removeWordFromEveryTitle', { word })}
        disabled={isBusy}
        onClick={onRemove}
      >
        <Icon of={XIcon} size={15} />
      </Button>
    </li>
  );
};

WordRow.displayName = 'WordRow';

export { WordRow };
