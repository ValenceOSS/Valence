import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X as XIcon } from '@keyline-icons/react/fill';
import { FileArrowUp as FileArrowUpIcon, Image as ImageIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Form } from '@ValenceUI/Form';
import { Icon } from '@ValenceUI/Icon';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SelectField } from '@ValenceUI/SelectField';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { addLiveSource } from '@ValenceClient/live/addLiveSource';
import { changeLiveSourcePicture } from '@ValenceClient/live/changeLiveSourcePicture';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import { NewLiveSourceSchema } from '@ValenceContracts/schemas/LiveTv';
import { GuideSuggestions } from '@ValenceScreens/components/AdminArea/components/LiveTvPanel/components/GuideSuggestions/GuideSuggestions';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { say } from '@ValenceI18n/say';
import type { AddLiveSourceDialogProps } from './AddLiveSourceDialog.types';

type Way = 'stream' | 'embed' | 'playlistUrl' | 'playlistFile' | 'tuner' | 'iptvOrg';

const WAYS: readonly { id: Way; label: string }[] = [
  { id: 'stream', label: say('screens.adminArea.liveTvPanel.oneStream') },
  { id: 'embed', label: say('screens.adminArea.liveTvPanel.embeddedPage') },
  { id: 'playlistUrl', label: say('screens.adminArea.liveTvPanel.playlistAddress') },
  { id: 'playlistFile', label: say('screens.adminArea.liveTvPanel.playlistFile') },
  { id: 'tuner', label: say('screens.adminArea.liveTvPanel.tuner') },
  { id: 'iptvOrg', label: say('screens.adminArea.liveTvPanel.iptvOrg') },
];

/**
 * Whether a choice of way in is one of the six on offer.
 *
 * @param id - The choice.
 * @returns Whether it is a way in.
 */
const isWay = (id: string): id is Way => WAYS.some((way) => way.id === id);

/**
 * Adds a live TV source, one of six ways: a single stream by its address, such as a sports
 * channel's; a web page whose own player is shown in a frame; a playlist of channels by address, or uploaded as a file; an HDHomeRun tuner on the
 * network; or a country's or category's playlist from iptv-org, picked from a list. A guide's
 * address can go with any of them, and a single stream or page can be given a picture for its logo.
 * The source's channels are read as it is added, and anything wrong is said before the dialog closes.
 *
 * @param isOpen - Whether the dialog is raised.
 * @param onClose - Told to lower it.
 * @param onAdded - Told once a source is added.
 */
const AddLiveSourceDialog = ({ isOpen, onClose, onAdded }: AddLiveSourceDialogProps) => {
  const [way, setWay] = useState<Way>('stream');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [guideUrl, setGuideUrl] = useState('');
  const [playlist, setPlaylist] = useState<{ name: string; text: string } | null>(null);
  const [picture, setPicture] = useState<File | null>(null);
  const [iptvBy, setIptvBy] = useState<'country' | 'category'>('country');
  const [iptvPick, setIptvPick] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const catalogue = useQuery({ ...liveQueries.iptvOrg(), enabled: isOpen && way === 'iptvOrg' });

  const iptvOptions =
    iptvBy === 'country'
      ? (catalogue.data?.countries ?? []).map((country) => ({
          id: country.playlistUrl,
          label: `${country.flag} ${country.name}`.trim(),
        }))
      : (catalogue.data?.categories ?? []).map((category) => ({
          id: category.playlistUrl,
          label: category.name,
        }));
  const picked = iptvOptions.find((option) => option.id === iptvPick) ?? null;

  const close = () => {
    setName('');
    setAddress('');
    setLogoUrl('');
    setGuideUrl('');
    setPlaylist(null);
    setPicture(null);
    setIptvPick('');
    setProblem(null);
    onClose();
  };

  const asked = () => {
    const guide = guideUrl.trim() === '' ? null : guideUrl;
    const named = name.trim();

    switch (way) {
      case 'stream':
      case 'embed':
        return {
          kind: way,
          name: named,
          address: address.trim(),
          logoUrl: logoUrl.trim() === '' ? null : logoUrl.trim(),
          guideUrl: guide,
        };
      case 'playlistUrl':
      case 'tuner':
        return { kind: way, name: named, address: address.trim(), guideUrl: guide };
      case 'playlistFile':
        return {
          kind: 'playlistFile',
          name: named === '' ? (playlist?.name ?? '') : named,
          playlist: playlist?.text ?? '',
          guideUrl: guide,
        };
      case 'iptvOrg':
        return {
          kind: 'playlistUrl',
          name:
            named === ''
              ? say('screens.adminArea.liveTvPanel.iptvOrgName', { name: picked?.label ?? '' })
              : named,
          address: iptvPick,
          guideUrl: guide,
        };
    }
  };

  const save = () => {
    const parsed = NewLiveSourceSchema.safeParse(asked());

    if (!parsed.success) {
      setProblem(say('screens.adminArea.liveTvPanel.fillInANameAndAnAddress'));

      return;
    }

    setIsSaving(true);
    setProblem(null);

    void addLiveSource(parsed.data)
      .then(async (sent) => {
        const pictured =
          sent.value === null || picture === null || (way !== 'stream' && way !== 'embed')
            ? null
            : await changeLiveSourcePicture(sent.value.id, picture);

        if (pictured !== null && pictured.refusal !== null) {
          notify.failed(pictured.refusal);
        }

        const isAdded = tellOutcome(
          say('screens.adminArea.liveTvPanel.addedNameWithCountChannels', {
            name: sent.value?.name ?? parsed.data.name,
            count: String(sent.value?.channelCount ?? 0),
          }),
          failureOfRefusal(sent.refusal),
        );

        if (isAdded) {
          onAdded();
          close();
        }
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Dialog
      label={say('screens.adminArea.liveTvPanel.addALiveTvSource')}
      isOpen={isOpen}
      onClose={close}
    >
      <DialogTitle title={say('screens.adminArea.liveTvPanel.addALiveTvSource')}>
        <Button isIconOnly variant="ghost" label={say('common.close')} size="sm" onClick={close}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <Form
        label={say('screens.adminArea.liveTvPanel.addALiveTvSource')}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        isDialog
      >
        <DialogContent>
          <div className="flex flex-col gap-4">
            <SegmentedRow
              label={say('screens.adminArea.liveTvPanel.whatToAdd')}
              items={WAYS}
              value={way}
              size="sm"
              onSelect={(next) => {
                if (isWay(next)) {
                  setWay(next);
                  setProblem(null);
                }
              }}
            />

            <TextField
              label={say('common.name')}
              value={name}
              onValueChange={setName}
              placeholder={
                way === 'stream' || way === 'embed'
                  ? say('screens.adminArea.liveTvPanel.formulaOneLive')
                  : say('screens.adminArea.liveTvPanel.myChannels')
              }
              {...(way === 'playlistFile' || way === 'iptvOrg'
                ? { description: say('screens.adminArea.liveTvPanel.leftEmptyItIsNamedForYou') }
                : {})}
            />

            {way === 'stream' || way === 'embed' || way === 'playlistUrl' || way === 'tuner' ? (
              <TextField
                label={
                  way === 'stream'
                    ? say('screens.adminArea.liveTvPanel.streamAddress')
                    : way === 'embed'
                      ? say('screens.adminArea.liveTvPanel.pageAddress')
                      : way === 'tuner'
                        ? say('screens.adminArea.liveTvPanel.tunerAddress')
                        : say('screens.adminArea.liveTvPanel.playlistAddress')
                }
                value={address}
                onValueChange={setAddress}
                type="url"
                description={
                  way === 'stream'
                    ? say('screens.adminArea.liveTvPanel.anHlsAddressOrAnyStream')
                    : way === 'embed'
                      ? say('screens.adminArea.liveTvPanel.aPageWithItsOwnPlayer')
                      : way === 'tuner'
                        ? say('screens.adminArea.liveTvPanel.theHdHomeRunsAddress')
                        : say('screens.adminArea.liveTvPanel.anM3uPlaylistEachStream')
                }
              />
            ) : null}

            {way === 'stream' || way === 'embed' ? (
              <TextField
                label={say('screens.adminArea.liveTvPanel.logoAddressOptional')}
                value={logoUrl}
                onValueChange={setLogoUrl}
                type="url"
              />
            ) : null}

            {way === 'stream' || way === 'embed' ? (
              <div className="flex items-center gap-3">
                <FilePicker
                  label={say('screens.adminArea.liveTvPanel.uploadAChannelPicture')}
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                  size="sm"
                  onPick={setPicture}
                >
                  <Icon of={ImageIcon} size={15} />
                  {picture === null
                    ? say('screens.adminArea.liveTvPanel.uploadAChannelPicture')
                    : say('common.chooseAnother')}
                </FilePicker>
                <span className="truncate text-xs text-text-muted">{picture?.name ?? ''}</span>
              </div>
            ) : null}

            {way === 'playlistFile' ? (
              <div className="flex items-center gap-3">
                <FilePicker
                  label={say('screens.adminArea.liveTvPanel.chooseAPlaylist')}
                  accept=".m3u,.m3u8,audio/x-mpegurl,application/vnd.apple.mpegurl"
                  size="sm"
                  onPick={(file) => {
                    void file.text().then((text) => {
                      setPlaylist({ name: file.name.replace(/\.m3u8?$/iu, ''), text });
                    });
                  }}
                >
                  <Icon of={FileArrowUpIcon} size={15} />
                  {say('screens.adminArea.liveTvPanel.chooseAPlaylist')}
                </FilePicker>
                <span className="truncate text-xs text-text-muted">{playlist?.name ?? ''}</span>
              </div>
            ) : null}

            {way === 'iptvOrg' ? (
              catalogue.isPending ? (
                <Spinner size="sm" label={say('common.reading')} />
              ) : catalogue.isError ? (
                <p className="text-sm text-danger">{say('error.live.iptvOrgCouldNotBeReached')}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <SegmentedRow
                    label={say('screens.adminArea.liveTvPanel.pickBy')}
                    items={[
                      { id: 'country', label: say('screens.adminArea.liveTvPanel.byCountry') },
                      { id: 'category', label: say('screens.adminArea.liveTvPanel.byCategory') },
                    ]}
                    value={iptvBy}
                    size="sm"
                    onSelect={(next) => {
                      setIptvBy(next === 'category' ? 'category' : 'country');
                      setIptvPick('');
                    }}
                  />
                  <SelectField
                    label={
                      iptvBy === 'country'
                        ? say('screens.adminArea.settingsPanel.country')
                        : say('screens.adminArea.indexerCatalogueDialog.category')
                    }
                    options={iptvOptions}
                    value={iptvPick}
                    onSelect={setIptvPick}
                    placeholder={say('screens.adminArea.librarySettingsDialog.chooseOne')}
                  />
                  <p className="text-xs text-text-muted">
                    {say('screens.adminArea.liveTvPanel.iptvOrgListsFreeChannels')}
                  </p>
                </div>
              )
            ) : null}

            <TextField
              label={say('screens.adminArea.liveTvPanel.guideAddressOptional')}
              value={guideUrl}
              onValueChange={setGuideUrl}
              description={say('screens.adminArea.liveTvPanel.anXmltvGuideSaysWhatsOn')}
            />
            <GuideSuggestions
              chosen={guideUrl}
              onAdd={(address) => {
                setGuideUrl((was) => `${was.trim()} ${address}`.trim());
              }}
            />

            {problem === null ? null : (
              <p role="alert" className="text-sm text-danger">
                {problem}
              </p>
            )}
          </div>
        </DialogContent>

        <DialogFooter
          dismiss={{ onChoose: close }}
          confirm={{
            label: say('common.add'),
            isSubmit: true,
            isLoading: isSaving,
          }}
        />
      </Form>
    </Dialog>
  );
};

AddLiveSourceDialog.displayName = 'AddLiveSourceDialog';

export { AddLiveSourceDialog };
