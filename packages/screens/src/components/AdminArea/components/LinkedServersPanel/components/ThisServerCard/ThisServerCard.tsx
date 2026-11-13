import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { notify } from '@ValenceUI/notify';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { ServerCallingCard } from '@ValenceScreens/components/AdminArea/components/LinkedServersPanel/components/ServerCallingCard/ServerCallingCard';
import { changeServerPicture } from '@ValenceClient/admin/changeServerPicture';
import { changeLinkIdentity } from '@ValenceClient/admin/changeLinkIdentity';
import { serverPictureUrl } from '@ValenceClient/linking/serverPictureUrl';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { say } from '@ValenceI18n/say';
import type { LinkIdentityChange } from '@ValenceContracts/schemas/LinkedServer';
import type { ThisServerCardProps } from './ThisServerCard.types';
import { PICTURE_LIMITS } from '@ValenceContracts/constants/PICTURE_LIMITS';
import { FramePictureDialog } from '@ValenceScreens/components/FramePictureDialog/FramePictureDialog';
import { PICTURE_ASPECTS } from '@ValenceContracts/constants/PICTURE_ASPECTS';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import { SavedText } from '@ValenceScreens/components/AdminArea/components/SavedText/SavedText';

const IS_LOCAL = /^https?:\/\/(localhost|127\.|\[::1\])/u;

/**
 * How other Valence servers see this one, as settings that save as they change: its picture,
 * name and colour, the address they reach it at, the fingerprint another admin checks an invite
 * against, and whether a request here goes once a linked server has the title.
 *
 * @param identity - This server as other servers see it.
 */
const ThisServerCard = ({ identity }: ThisServerCardProps) => {
  const cache = useQueryClient();
  const [framing, setFraming] = useState<File | null>(null);
  const reread = () => cache.invalidateQueries({ queryKey: adminQueries.linking().queryKey });

  const save = async (change: LinkIdentityChange): Promise<boolean> => {
    const sent = await changeLinkIdentity(change);

    if (sent.refusal !== null) {
      notify.failed(sent.refusal.message);

      return false;
    }

    notify.worked(say('screens.adminArea.linkedServersPanel.savedThisServer'));
    await reread();

    return true;
  };

  const changePicture = (file: File | null, frame: PhotoFrame | null = null) => {
    void changeServerPicture(file, frame).then(async (sent) => {
      if (sent.refusal !== null) {
        notify.failed(sent.refusal);

        return;
      }

      await reread();
    });
  };

  return (
    <PanelCard
      title={say('common.thisServer')}
      isFlush
      actions={
        <PanelCardInfo
          label={say('screens.adminArea.linkedServersPanel.aboutThisServer')}
          detail={say('screens.adminArea.linkedServersPanel.howOtherServersSeeThisOne')}
        />
      }
    >
      <div className="border-b border-[var(--surface-line)]">
        <ServerCallingCard
          name={identity.name}
          colour={identity.colour}
          picture={serverPictureUrl(null, identity.pictureAt)}
          address={identity.address}
          fingerprint={identity.fingerprint}
          standing={
            IS_LOCAL.test(identity.address) ? (
              <Badge tone="warning" size="sm">
                {say('screens.adminArea.linkedServersPanel.notReachableFromOtherServers')}
              </Badge>
            ) : null
          }
        >
          <ColourChoice
            label={say('common.colour')}
            value={identity.colour}
            isCompact
            onChange={(colour) => {
              void save({ colour });
            }}
          />
          <FilePicker
            label={say('common.chooseAPicture')}
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            size="sm"
            onPick={setFraming}
          >
            <Icon of={ImageIcon} size={15} />
            {identity.pictureAt === null
              ? say('common.chooseAPicture')
              : say('common.chooseAnother')}
          </FilePicker>
          <FramePictureDialog
            file={framing}
            limits={PICTURE_LIMITS.face}
            aspect={PICTURE_ASPECTS.face}
            shape="circle"
            onClose={() => {
              setFraming(null);
            }}
            onUse={(file, frame) => {
              setFraming(null);
              changePicture(file, frame);
            }}
          />
          {identity.pictureAt === null ? null : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                changePicture(null);
              }}
            >
              {say('screens.adminArea.linkedServersPanel.removeThePicture')}
            </Button>
          )}
        </ServerCallingCard>
      </div>

      <SettingList isInset>
        <SettingRow
          title={say('common.name')}
          description={say('screens.adminArea.linkedServersPanel.whatOtherServersCallThisOne')}
        >
          <SavedText
            label={say('common.name')}
            saved={identity.name}
            onSave={(name) => save({ name })}
          />
        </SettingRow>

        <SettingRow
          title={say('common.address')}
          description={
            IS_LOCAL.test(identity.address)
              ? say('screens.adminArea.linkedServersPanel.otherServersCantReachLocalhost')
              : say('screens.adminArea.linkedServersPanel.whereOtherServersReachThisOne')
          }
        >
          <SavedText
            label={say('common.address')}
            type="url"
            saved={identity.address}
            onSave={(address) => save({ address })}
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.linkedServersPanel.dropRequestsALinkedServerHas')}
          description={say('screens.adminArea.linkedServersPanel.removesARequestHereOnce')}
        >
          <Switch
            label={say('screens.adminArea.linkedServersPanel.dropRequestsALinkedServerHas')}
            isLabelHidden
            isOn={identity.dropsRequestsElsewhere}
            onToggle={() => {
              void save({ dropsRequestsElsewhere: !identity.dropsRequestsElsewhere });
            }}
          />
        </SettingRow>
      </SettingList>
    </PanelCard>
  );
};

ThisServerCard.displayName = 'ThisServerCard';

export { ThisServerCard };
