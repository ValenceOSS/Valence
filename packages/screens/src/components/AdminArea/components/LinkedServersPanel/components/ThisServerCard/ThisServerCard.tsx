import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { FaceCircle } from '@ValenceScreens/components/FaceCircle/FaceCircle';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { changeLinkIdentity } from '@ValenceClient/admin/changeLinkIdentity';
import { groupFingerprint } from '@ValenceClient/linking/groupFingerprint';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import type { ThisServerCardProps } from './ThisServerCard.types';
import { say } from '@ValenceI18n/say';

const AN_INITIAL = { kind: 'initial', font: 'gilroy' } as const;

/**
 * How other Valence servers see this one: its name and colour, which they draw beside what comes
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

  return (
    <PanelCard title={say('common.thisServer')}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <FaceCircle
            name={name === '' ? identity.name : name}
            colour={colour}
            avatar={AN_INITIAL}
            source=""
            className="size-10 text-base"
          />
          <p className="text-xs leading-relaxed text-text-muted">
            {say('screens.adminArea.linkedServersPanel.howOtherServersSeeThisOne')}
          </p>
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
