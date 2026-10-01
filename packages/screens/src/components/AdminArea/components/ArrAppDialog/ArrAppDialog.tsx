import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { notify } from '@ValenceUI/notify';
import { useEffect, useRef, useState } from 'react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FormField } from '@ValenceUI/FormField';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { addArrApp, changeArrApp, tryArrApp } from '@ValenceClient/requests/fetchArrApps';
import { ARR_APP_KINDS } from '@ValenceContracts/schemas/ArrApp';
import { ARR_APP_NAMES } from '@ValenceScreens/components/AdminArea/ARR_APP_NAMES';
import { TryItButton } from '@ValenceScreens/components/AdminArea/components/TryItButton/TryItButton';
import { USUAL_ADDRESSES, arrAppFormFor, choosingArrKind, readArrAppForm } from './readArrAppForm';
import type { TryVerdict } from '@ValenceScreens/components/AdminArea/components/TryItButton/TryItButton.types';
import type { ArrAppForm } from './readArrAppForm';
import type { ArrAppDialogProps } from './ArrAppDialog.types';
import { say } from '@ValenceI18n/say';

const KINDS = ARR_APP_KINDS.map((kind) => ({ id: kind, label: ARR_APP_NAMES[kind] }));

/**
 * Connects a Radarr, Sonarr, Lidarr or Prowlarr, or changes one already connected: where it is,
 * its API key, and where its library is as it sees it and as Valence does, which can be tried
 * before it is saved — a key is never shown back, and leaving it empty keeps the one it has.
 *
 * Only the latest try for the app showing is told: one still answering when another app is opened,
 * or when it is tried again, says nothing, so no app is shown another's version.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param app - The app being changed, or null to connect one.
 * @param onClose - Called when it is dismissed.
 * @param onSaved - Called with the app as kept.
 */
const ArrAppDialog = ({ isOpen, app, onClose, onSaved }: ArrAppDialogProps) => {
  const [form, setForm] = useState<ArrAppForm>(() => arrAppFormFor(app, ARR_APP_NAMES));
  const [shownFor, setShownFor] = useState(app);
  const [problem, setProblem] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isTrying, setIsTrying] = useState(false);
  const [verdict, setVerdict] = useState<TryVerdict>(null);
  const [version, setVersion] = useState<string | null>(null);
  const latestTry = useRef<object | null>(null);
  const showing = useRef(app);

  useEffect(() => {
    showing.current = app;
  }, [app]);

  if (shownFor !== app) {
    setShownFor(app);
    setForm(arrAppFormFor(app, ARR_APP_NAMES));
    setProblem(null);
    setVerdict(null);
    setVersion(null);
    setIsWorking(false);
    setIsTrying(false);
  }

  const change = (next: Partial<ArrAppForm>) => {
    setForm((current) => ({ ...current, ...next }));
    setVerdict(null);
    setProblem(null);
  };

  const read = () => {
    const outcome = readArrAppForm(form, app?.hasApiKey === true);

    setProblem(outcome.problem);

    return outcome.draft;
  };

  const tryIt = () => {
    const draft = read();

    if (draft === null) {
      return;
    }

    setIsWorking(true);
    setIsTrying(true);
    setVerdict(null);

    const thisTry = {};
    const isLatest = () => latestTry.current === thisTry && showing.current === app;

    latestTry.current = thisTry;

    void tryArrApp(draft, app?.id)
      .then(({ value, refusal }) => {
        if (!isLatest()) {
          return;
        }

        setVerdict(value?.isWorking === true ? 'working' : 'failing');
        setVersion(value?.version ?? null);
        setProblem(
          value === null
            ? (refusal?.message ?? say('common.itCouldNotBeTried'))
            : value.isWorking
              ? null
              : (sayAgainIfAny(value.problem) ?? say('common.itDidNotAnswer')),
        );
      })
      .finally(() => {
        if (isLatest()) {
          setIsWorking(false);
          setIsTrying(false);
        }
      });
  };

  const save = () => {
    const draft = read();

    if (draft === null) {
      return;
    }

    setIsWorking(true);

    void (app === null ? addArrApp(draft) : changeArrApp(app.id, draft))
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(refusal?.message ?? say('common.thatCouldNotBeSaved'));

          return;
        }

        notify.worked(
          app === null
            ? say('common.addedName', { name: value.name })
            : say('common.savedName', { name: value.name }),
        );
        onSaved(value);
        onClose();
      })
      .finally(() => {
        setIsWorking(false);
      });
  };

  const title =
    app === null
      ? say('screens.adminArea.arrAppDialog.connectAnApp')
      : say('common.changeName', { name: app.name });

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail={say('screens.adminArea.arrAppDialog.keepTheAppsYouAlreadyRun')}
      />

      <DialogContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {app === null ? (
            <FormField label={say('screens.adminArea.arrAppDialog.app')}>
              <SegmentedRow
                label={say('screens.adminArea.arrAppDialog.app')}
                size="sm"
                items={KINDS}
                value={form.kind}
                onSelect={(next) => {
                  const chosen = KINDS.find((one) => one.id === next);

                  if (chosen !== undefined) {
                    change(choosingArrKind(form, chosen.id, ARR_APP_NAMES));
                  }
                }}
              />
            </FormField>
          ) : null}

          <TextField
            label={say('common.name')}
            value={form.name}
            onValueChange={(name) => {
              change({ name });
            }}
            placeholder={ARR_APP_NAMES[form.kind]}
            required
          />

          <Switch
            label={
              form.kind === 'prowlarr'
                ? say('screens.adminArea.arrAppDialog.keepItsIndexersInStep')
                : say('screens.adminArea.arrAppDialog.handItRequests')
            }
            isOn={form.isEnabled}
            onToggle={() => {
              change({ isEnabled: !form.isEnabled });
            }}
          />
        </div>

        <HeadedSection title={say('common.connection')}>
          <div className="flex flex-col gap-4">
            <TextField
              label={say('common.address')}
              type="url"
              value={form.url}
              onValueChange={(url) => {
                change({ url });
              }}
              placeholder={USUAL_ADDRESSES[form.kind]}
              description={say('screens.adminArea.arrAppDialog.whereTheRequestsServiceReachesIt')}
              required
            />

            <TextField
              label={say('common.aPIKey')}
              type="password"
              value={form.apiKey}
              onValueChange={(apiKey) => {
                change({ apiKey });
              }}
              description={
                app?.hasApiKey === true
                  ? say('screens.adminArea.indexerDialog.aKeyIsKeptTypeA')
                  : say('screens.adminArea.arrAppDialog.itIsUnderSettingsGeneral')
              }
              autoComplete="off"
            />
          </div>
        </HeadedSection>

        {form.kind === 'prowlarr' ? null : (
          <HeadedSection title={say('screens.adminArea.arrAppDialog.whereItsLibraryIs')}>
            <FormField
              label={say('screens.adminArea.arrAppDialog.mapItsFoldersOntoValences')}
              description={say('screens.adminArea.arrAppDialog.onlyWhereTheAppAndValence')}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label={say('screens.adminArea.arrAppDialog.asTheAppSeesIt')}
                  value={form.remotePath}
                  onValueChange={(remotePath) => {
                    change({ remotePath });
                  }}
                  placeholder="/movies"
                />

                <TextField
                  label={say('screens.adminArea.downloadClientDialog.asValenceSeesIt')}
                  value={form.localPath}
                  onValueChange={(localPath) => {
                    change({ localPath });
                  }}
                  placeholder="/media/Films"
                />
              </div>
            </FormField>
          </HeadedSection>
        )}

        <p role="status" className="sr-only">
          {verdict !== 'working'
            ? ''
            : version === null
              ? say('screens.adminArea.downloadClientDialog.itAnsweredAndIsWorking')
              : say('screens.adminArea.downloadClientDialog.itAnsweredAndIsVersion', { version })}
        </p>
      </DialogContent>

      <DialogFooter
        note={problem}
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: app === null ? say('common.connect') : say('common.save'),
          onChoose: save,
          isDisabled: isWorking,
        }}
      >
        <TryItButton isTrying={isTrying} verdict={verdict} isDisabled={isWorking} onTry={tryIt} />
      </DialogFooter>
    </DialogCompanion>
  );
};

ArrAppDialog.displayName = 'ArrAppDialog';

export { ArrAppDialog };
