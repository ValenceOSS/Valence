import { useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import type { VersionRowProps } from './VersionRow.types';
import { say } from '@ValenceI18n/say';

/**
 * One version of a film on its Files tab: its file, the name it goes by, saved once typing is done,
 * and whether it plays by default, or a way to make it.
 *
 * @param file - Its file's name.
 * @param label - What it is called now, or nothing for the original.
 * @param isDefault - Whether it plays by default.
 * @param isBusy - Whether a change to it is being saved.
 * @param onLabel - Told the name it is to go by.
 * @param onDefault - Told it is to play by default.
 * @param onSplit - Opens Fix match for this file alone, where it is really a different film.
 */
const VersionRow = ({
  file,
  label,
  isDefault,
  isBusy,
  onLabel,
  onDefault,
  onSplit,
}: VersionRowProps) => {
  const [typed, setTyped] = useState(label ?? '');
  const [saved, setSaved] = useState(label ?? '');
  const settle = () => {
    if (typed.trim() !== saved) {
      setSaved(typed.trim());
      onLabel(typed.trim());
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-3 py-2 @xl:flex-nowrap">
      <span className="min-w-0 flex-1 truncate font-body text-sm text-text" title={file}>
        {file}
      </span>
      <TextField
        label={say('screens.adminArea.titleVersions.nameOfVersion', { file })}
        isLabelHidden
        size="sm"
        placeholder={say('screens.adminArea.titleVersions.noName')}
        value={typed}
        onValueChange={setTyped}
        onBlur={settle}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            settle();
          }
        }}
        className="w-56 max-w-full"
      />
      {onSplit === undefined ? null : (
        <Button
          variant="ghost"
          size="sm"
          label={say('screens.adminArea.titleVersions.splitOffName', { file })}
          onClick={onSplit}
        >
          {say('screens.adminArea.titleVersions.splitOff')}
        </Button>
      )}
      <span className="flex w-40 shrink-0 justify-end">
        {isDefault ? (
          <Badge size="sm" tone="accent">
            {say('screens.adminArea.titleVersions.playsByDefault')}
          </Badge>
        ) : (
          <Button variant="secondary" size="sm" isLoading={isBusy} onClick={onDefault}>
            {say('screens.adminArea.titleVersions.playThisByDefault')}
          </Button>
        )}
      </span>
    </li>
  );
};

VersionRow.displayName = 'VersionRow';

export { VersionRow };
