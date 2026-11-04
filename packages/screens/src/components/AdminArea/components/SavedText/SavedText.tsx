import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { say } from '@ValenceI18n/say';
import type { SavedTextProps } from './SavedText.types';

const FINE = () => null;

/**
 * A text setting that saves with its own button once it is changed, saying under the field what is
 * wrong with what was typed rather than offering to save it.
 *
 * @param label - What it is.
 * @param saved - The value as saved.
 * @param onSave - Saves a new value, answering whether it was kept; what was typed stays until it is.
 * @param problemOf - Says what is wrong with a typed value, where anything can be.
 * @param type - The kind of text.
 */
const SavedText = ({ label, saved, onSave, problemOf = FINE, type = 'text' }: SavedTextProps) => {
  const [value, setValue] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const shown = value ?? saved;
  const problem = value === null ? null : problemOf(value);
  const isChanged = value !== null && value.trim() !== saved && value.trim() !== '';

  return (
    <span className="flex w-96 max-w-full items-start gap-2">
      <TextField
        label={label}
        isLabelHidden
        type={type}
        size="sm"
        value={shown}
        onValueChange={setValue}
        className="min-w-0 flex-1"
        {...(problem === null ? {} : { error: problem })}
      />
      {isChanged && problem === null ? (
        <Button
          variant="confirm"
          size="sm"
          isLoading={isSaving}
          onClick={() => {
            setIsSaving(true);
            void onSave(shown.trim())
              .then((isSaved) => {
                if (isSaved) {
                  setValue(null);
                }
              })
              .finally(() => {
                setIsSaving(false);
              });
          }}
        >
          {say('common.save')}
        </Button>
      ) : null}
    </span>
  );
};

SavedText.displayName = 'SavedText';

export { SavedText };
