import { useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { SettingRow } from '@ValenceUI/SettingRow';
import { TextField } from '@ValenceUI/TextField';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { say } from '@ValenceI18n/say';
import type { ServiceKeyRowProps } from './ServiceKeyRow.types';

/**
 * An online service that needs a key: whether one is saved, and a button that opens a field to set
 * or change it, with where to get a free one beside it where there is such a place. A saved key is
 * never shown again.
 *
 * @param title - The service.
 * @param about - What the service is for, in the info beside its name.
 * @param description - What it brings, in one line.
 * @param isSet - Whether a key is saved.
 * @param freeKeyAt - Where to get a free key, if anywhere.
 * @param save - Saves a key, answering whether it worked.
 * @param done - What to say once it is saved.
 * @param failed - What to say where it could not be.
 * @param onSaved - Told once a key is saved.
 */
const ServiceKeyRow = ({
  title,
  about,
  description,
  isSet,
  freeKeyAt,
  save,
  done,
  failed,
  onSaved,
}: ServiceKeyRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [key, setKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  return (
    <SettingRow
      title={title}
      info={
        <PanelCardInfo
          label={say('screens.adminArea.statStrip.aboutLabel', { label: title })}
          detail={about}
          align="start"
        />
      }
      description={description}
    >
      {isEditing ? (
        <>
          {freeKeyAt === undefined ? null : (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                window.open(freeKeyAt, '_blank', 'noopener,noreferrer');
              }}
            >
              {say('common.getAFreeKey')}
            </Button>
          )}
          <TextField
            label={say('screens.adminArea.serviceKeyRow.titleKey', { title })}
            isLabelHidden
            type="password"
            size="sm"
            autoComplete="off"
            value={key}
            onValueChange={setKey}
            placeholder={say('screens.adminArea.settingsPanel.pasteAKey')}
            className="w-56 max-w-full"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsEditing(false);
              setKey('');
            }}
          >
            {say('common.cancel')}
          </Button>
          <Button
            variant="confirm"
            size="sm"
            disabled={key.trim() === ''}
            isLoading={isSaving}
            onClick={() => {
              setIsSaving(true);

              void save(key.trim()).then((isSaved) => {
                setIsSaving(false);

                if (tellOutcome(done, isSaved ? null : failed)) {
                  setIsEditing(false);
                  setKey('');
                  onSaved();
                }
              });
            }}
          >
            {say('common.save')}
          </Button>
        </>
      ) : (
        <>
          {isSet ? (
            <Badge tone="success">{say('screens.adminArea.serviceKeyRow.keySet')}</Badge>
          ) : (
            <Badge tone="quiet">{say('screens.adminArea.serviceKeyRow.noKey')}</Badge>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="w-26"
            onClick={() => {
              setIsEditing(true);
            }}
          >
            {isSet
              ? say('screens.adminArea.serviceKeyRow.changeKey')
              : say('screens.adminArea.serviceKeyRow.addKey')}
          </Button>
        </>
      )}
    </SettingRow>
  );
};

ServiceKeyRow.displayName = 'ServiceKeyRow';

export { ServiceKeyRow };
