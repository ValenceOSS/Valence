import { useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { SettingRow } from '@ValenceUI/SettingRow';
import { say } from '@ValenceI18n/say';
import type { SourceRowProps } from './SourceRow.types';

/**
 * One subtitle source with a key: whether one is saved, and a button that opens the fields to set
 * or change it beneath the row.
 *
 * @param title - The source.
 * @param description - What it brings.
 * @param isSet - Whether a key is saved.
 * @param freeKeyAt - Where to get a key.
 * @param fields - The fields shown while it is being changed.
 * @param canSave - Whether what is typed can be saved.
 * @param isSaving - Whether a save is in flight.
 * @param onSave - Saves what is typed; resolves true once saved.
 * @param onCancel - Clears what is typed.
 */
const SourceRow = ({
  title,
  description,
  isSet,
  freeKeyAt,
  fields,
  canSave,
  isSaving,
  onSave,
  onCancel,
}: SourceRowProps) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div>
      <SettingRow title={title} description={description}>
        {isSet ? (
          <Badge tone="success">{say('screens.adminArea.serviceKeyRow.keySet')}</Badge>
        ) : (
          <Badge tone="quiet">{say('screens.adminArea.serviceKeyRow.noKey')}</Badge>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="w-26"
          disabled={isEditing}
          onClick={() => {
            setIsEditing(true);
          }}
        >
          {isSet ? say('common.change') : say('common.setUp')}
        </Button>
      </SettingRow>

      {isEditing ? (
        <div className="flex flex-col gap-3 pb-4">
          {fields}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="link"
              size="sm"
              className="px-0"
              onClick={() => {
                window.open(freeKeyAt, '_blank', 'noopener,noreferrer');
              }}
            >
              {say('common.getAFreeKey')}
            </Button>
            <span className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onCancel();
                  setIsEditing(false);
                }}
              >
                {say('common.cancel')}
              </Button>
              <Button
                variant="confirm"
                size="sm"
                disabled={!canSave}
                isLoading={isSaving}
                onClick={() => {
                  void onSave().then((isSaved) => {
                    if (isSaved) {
                      setIsEditing(false);
                    }
                  });
                }}
              >
                {say('common.save')}
              </Button>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

SourceRow.displayName = 'SourceRow';

export { SourceRow };
