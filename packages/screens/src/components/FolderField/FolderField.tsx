import { useState } from 'react';
import { Folder as FolderIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { FolderBrowser } from '@ValenceScreens/components/AdminArea/components/FolderBrowser/FolderBrowser';
import type { FolderFieldProps } from './FolderField.types';
import { say } from '@ValenceI18n/say';

/**
 * A folder on the server, typed or found: the path in a field with a way to browse the server's
 * folders beside it, which opens beneath the field and fills it with the folder chosen.
 *
 * @param label - What the folder is for.
 * @param value - The path.
 * @param onValueChange - Told the path whenever it changes, typed or chosen.
 * @param placeholder - An example path.
 * @param description - A line more about the folder.
 * @param error - Why the path will not do, where it will not.
 * @param isLabelHidden - Whether the label is only read out, for a field already named beside it.
 */
const FolderField = ({
  label,
  value,
  onValueChange,
  placeholder,
  description,
  error,
  isLabelHidden = false,
}: FolderFieldProps) => {
  const [isBrowsing, setIsBrowsing] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <TextField
        label={label}
        isLabelHidden={isLabelHidden}
        value={value}
        onValueChange={onValueChange}
        {...(placeholder === undefined ? {} : { placeholder })}
        {...(description === undefined ? {} : { description })}
        {...(error === undefined ? {} : { error })}
        {...(isBrowsing
          ? {}
          : {
              trailing: (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsBrowsing(true);
                  }}
                >
                  <Icon of={FolderIcon} size={14} />
                  {say('screens.adminArea.addLibraryDialog.browse')}
                </Button>
              ),
            })}
      />

      {isBrowsing ? (
        <FolderBrowser
          start={value}
          onChoose={(chosen) => {
            onValueChange(chosen);
            setIsBrowsing(false);
          }}
          onCancel={() => {
            setIsBrowsing(false);
          }}
        />
      ) : null}
    </div>
  );
};

FolderField.displayName = 'FolderField';

export { FolderField };
