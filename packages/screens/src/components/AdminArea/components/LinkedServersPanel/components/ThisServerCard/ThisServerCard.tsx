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
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { changeLinkIdentity } from '@ValenceClient/admin/changeLinkIdentity';
import { groupFingerprint } from '@ValenceClient/linking/groupFingerprint';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import type { ThisServerCardProps } from './ThisServerCard.types';
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
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<File | null>(null);
  const isChanged =
    name.trim() !== identity.name || colour !== identity.colour || address !== identity.address;

  const save = () => {
    setIsSaving(true);

    void changeLinkIdentity({ name: name.trim(), colour, address })
      .then(async (sent) => {
        if (sent.refusal !== null) {
          notify.failed(sent.refusal.message);

          return;
        }

        notify.worked(say('screens.adminArea.linkedServersPanel.savedThisServer'));
        await cache.invalidateQueries({ queryKey: adminQueries.linking().queryKey });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const changePicture = (file: File | null) => {
    setUploading(file);

    void changeServerPicture(file)
      .then(async (sent) => {
        if (sent.refusal !== null) {
          notify.failed(sent.refusal);

          return;
        }

        notify.worked(
          file === null
            ? say('screens.adminArea.linkedServersPanel.thePictureIsRemoved')
            : say('screens.adminArea.linkedServersPanel.thePictureIsSaved'),
        );
        await cache.invalidateQueries({ queryKey: adminQueries.linking().queryKey });
      })
      .finally(() => {
        setUploading(null);
      });
  };

  return (
    <PanelCard title={say('common.thisServer')}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <ServerFace
            name={name === '' ? identity.name : name}
            colour={colour}
            picture={serverPictureUrl(null, identity.pictureAt)}
            pending={uploading}
            className="size-10 text-base"
          />
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-text-muted">
            {say('screens.adminArea.linkedServersPanel.howOtherServersSeeThisOne')}
          </p>
          <span className="flex items-center gap-2">
            <FilePicker
              label={say('common.chooseAPicture')}
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
              size="sm"
              isLoading={uploading !== null}
              onPick={(file) => {
                changePicture(file);
              }}
            >
              <Icon of={ImageIcon} size={15} />
              {identity.pictureAt === null
                ? say('common.chooseAPicture')
                : say('common.chooseAnother')}
            </FilePicker>
            {identity.pictureAt === null ? null : (
              <Button
                variant="ghost"
                size="sm"
                disabled={uploading !== null}
                onClick={() => {
                  changePicture(null);
                }}
              >
                {say('screens.adminArea.linkedServersPanel.removeThePicture')}
              </Button>
            )}
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
              isOn={identity.dropsRequestsElsewhere}
              disabled={isSaving}
              onToggle={() => {
                setIsSaving(true);

                void changeLinkIdentity({
                  dropsRequestsElsewhere: !identity.dropsRequestsElsewhere,
                })
                  .then(async (sent) => {
                    if (sent.refusal !== null) {
                      notify.failed(sent.refusal.message);

                      return;
                    }

                    notify.worked(say('screens.adminArea.linkedServersPanel.savedThisServer'));
                    await cache.invalidateQueries({ queryKey: adminQueries.linking().queryKey });
                  })
                  .finally(() => {
                    setIsSaving(false);
                  });
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
            onClick={save}
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
