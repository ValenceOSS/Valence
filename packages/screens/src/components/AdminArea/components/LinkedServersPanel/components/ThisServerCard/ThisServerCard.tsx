import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { Image as ImageIcon } from '@keyline-icons/react';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { ServerFace } from '@ValenceScreens/components/AdminArea/components/LinkedServersPanel/components/ServerFace/ServerFace';
import { changeServerPicture } from '@ValenceClient/admin/changeServerPicture';
import { serverPictureUrl } from '@ValenceClient/linking/serverPictureUrl';
import { PanelCard } from '@ValenceUI/PanelCard';
import { changeLinkIdentity } from '@ValenceClient/admin/changeLinkIdentity';
import { groupFingerprint } from '@ValenceClient/linking/groupFingerprint';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import type { PictureChange, ThisServerCardProps } from './ThisServerCard.types';
import { say } from '@ValenceI18n/say';

/**
 * How other Valence servers see this one: its name, colour and picture, which they draw beside what comes
 * from here, where they reach it, and the fingerprint another admin checks an invite against.
 *
 * @param identity - This server as other servers see it.
 */
const ThisServerCard = ({ identity }: ThisServerCardProps) => {
  const cache = useQueryClient();
  const [name, setName] = useState(identity.name);
  const [colour, setColour] = useState(identity.colour);
  const [address, setAddress] = useState(identity.address);
  const [dropsRequests, setDropsRequests] = useState(identity.dropsRequestsElsewhere);
  const [picture, setPicture] = useState<PictureChange>({ kind: 'kept' });
  const [isSaving, setIsSaving] = useState(false);
  const isChanged =
    name.trim() !== identity.name ||
    colour !== identity.colour ||
    address !== identity.address ||
    dropsRequests !== identity.dropsRequestsElsewhere ||
    picture.kind !== 'kept';
  const hasAPicture =
    picture.kind === 'new' || (picture.kind === 'kept' && identity.pictureAt !== null);

  const save = async (): Promise<void> => {
    setIsSaving(true);

    const pictureSent =
      picture.kind === 'kept'
        ? null
        : await changeServerPicture(picture.kind === 'new' ? picture.file : null);

    if (pictureSent !== null && pictureSent.refusal !== null) {
      setIsSaving(false);
      notify.failed(pictureSent.refusal);

      return;
    }

    if (pictureSent !== null) {
      setPicture({ kind: 'kept' });
      await cache.invalidateQueries({ queryKey: adminQueries.linking().queryKey });
    }

    const sent = await changeLinkIdentity({
      name: name.trim(),
      colour,
      address,
      dropsRequestsElsewhere: dropsRequests,
    });

    setIsSaving(false);

    if (sent.refusal !== null) {
      notify.failed(sent.refusal.message);

      return;
    }

    notify.worked(say('screens.adminArea.linkedServersPanel.savedThisServer'));
    await cache.invalidateQueries({ queryKey: adminQueries.linking().queryKey });
  };

  return (
    <PanelCard title={say('common.thisServer')}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <ServerFace
            name={name === '' ? identity.name : name}
            colour={colour}
            picture={picture.kind === 'removed' ? null : serverPictureUrl(null, identity.pictureAt)}
            pending={picture.kind === 'new' ? picture.file : null}
            className="size-10 text-base"
          />
          <p className="min-w-0 flex-1 basis-48 text-xs leading-relaxed text-text-muted">
            {say('screens.adminArea.linkedServersPanel.howOtherServersSeeThisOne')}
          </p>
          <span className="flex items-center gap-2">
            <FilePicker
              label={say('common.chooseAPicture')}
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
              size="sm"
              disabled={isSaving}
              onPick={(file) => {
                setPicture({ kind: 'new', file });
              }}
            >
              <Icon of={ImageIcon} size={15} />
              {hasAPicture ? say('common.chooseAnother') : say('common.chooseAPicture')}
            </FilePicker>
            {hasAPicture ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={isSaving}
                onClick={() => {
                  setPicture(identity.pictureAt === null ? { kind: 'kept' } : { kind: 'removed' });
                }}
              >
                {say('screens.adminArea.linkedServersPanel.removeThePicture')}
              </Button>
            ) : null}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <TextField label={say('common.name')} value={name} onValueChange={setName} size="sm" />
          <TextField
            label={say('screens.adminArea.linkedServersPanel.whereOtherServersReachIt')}
            value={address}
            onValueChange={setAddress}
            type="url"
            size="sm"
          />
        </div>

        <ColourChoice label={say('common.colour')} value={colour} onChange={setColour} />

        <SettingList>
          <SettingRow
            title={say('screens.adminArea.linkedServersPanel.dropRequestsALinkedServerHas')}
            description={say('screens.adminArea.linkedServersPanel.whenALinkedServerGetsSomething')}
          >
            <Switch
              label={say('screens.adminArea.linkedServersPanel.dropRequestsALinkedServerHas')}
              isLabelHidden
              isOn={dropsRequests}
              disabled={isSaving}
              onToggle={() => {
                setDropsRequests(!dropsRequests);
              }}
            />
          </SettingRow>
        </SettingList>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">
              {say('screens.adminArea.linkedServersPanel.fingerprint')}
            </span>
            <code className="select-all font-mono text-sm">
              {groupFingerprint(identity.fingerprint)}
            </code>
          </div>

          <Button
            variant="glossy"
            size="sm"
            isLoading={isSaving}
            disabled={!isChanged || name.trim() === ''}
            onClick={() => {
              void save();
            }}
          >
            {say('common.save')}
          </Button>
        </div>
      </div>
    </PanelCard>
  );
};

ThisServerCard.displayName = 'ThisServerCard';

export { ThisServerCard };
