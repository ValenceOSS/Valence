import { useEffect, useState } from 'react';
import {
  ShieldCheck as ShieldCheckIcon,
  TriangleAlert as TriangleAlertIcon,
} from '@keyline-icons/react/fill';
import { Callout } from '@ValenceUI/Callout';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { describePermission } from '@ValenceClient/plugins/describePermission';
import { installPlugin } from '@ValenceClient/plugins/installPlugin';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { TrustBadge } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/TrustBadge/TrustBadge';
import type { InstallReviewDialogProps } from './InstallReviewDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Shows the last look before a plugin is installed, who made it, who vouches for it and what it may
 * do, and installs it with the fingerprint of the permissions shown once any warning is accepted.
 *
 * @param preview - What the server fetched and checked, or nothing while the dialog is shut.
 * @param onClose - Told it was dismissed.
 * @param onInstalled - Told the plugin was installed.
 */
const InstallReviewDialog = ({ preview, onClose, onInstalled }: InstallReviewDialogProps) => {
  const [isUnderstood, setIsUnderstood] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    setIsUnderstood(false);
  }, [preview?.token]);

  const isUnsigned = preview?.trust === 'unsigned';
  const isTrusted = preview?.trust === 'trusted';

  return (
    <Dialog
      label={say('screens.pluginsPanel.installReviewDialog.installAPlugin')}
      isOpen={preview !== null}
      onClose={onClose}
    >
      {preview === null ? null : (
        <>
          <DialogTitle
            title={say('screens.pluginsPanel.installReviewDialog.installName', {
              name: preview.plugin.name,
            })}
            detail={say('screens.pluginsPanel.installReviewDialog.versionVersionByAuthor', {
              version: preview.plugin.version,
              author: preview.plugin.author,
            })}
            icon={
              <Icon
                of={isUnsigned ? TriangleAlertIcon : ShieldCheckIcon}
                size={18}
                className={isUnsigned ? 'text-danger' : isTrusted ? 'text-accent' : 'text-success'}
              />
            }
          >
            <TrustBadge trust={preview.trust} isAsking />
          </DialogTitle>

          <DialogContent className="flex flex-col gap-5">
            {isUnsigned ? (
              <Callout
                title={say(
                  'screens.pluginsPanel.installReviewDialog.valenceCannotVouchForThisPlugin',
                )}
                tone="danger"
                icon={TriangleAlertIcon}
              >
                {say('screens.pluginsPanel.installReviewDialog.itIsNotSignedByThe')}
              </Callout>
            ) : isTrusted ? (
              <Callout
                title={say('screens.pluginsPanel.installReviewDialog.signedByAKeyYouTrust')}
                tone="quiet"
                icon={ShieldCheckIcon}
              >
                {say('screens.pluginsPanel.installReviewDialog.valenceHasNotCheckedThisPlugin')}
              </Callout>
            ) : null}

            {preview.warnings.map((warning) => (
              <Callout key={warning} title={warning} tone="warning" />
            ))}

            {preview.replacesVersion === null ? null : (
              <p className="text-sm text-text-muted">
                {say(
                  'screens.pluginsPanel.installReviewDialog.thisReplacesVersionReplacesVersionKeepingIts',
                  { replacesVersion: preview.replacesVersion },
                )}
              </p>
            )}

            <p className="text-sm leading-relaxed text-text">{preview.plugin.description}</p>

            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-text-muted">
                {say('screens.pluginsPanel.installReviewDialog.itWillBeAllowedTo')}
              </h3>

              {preview.plugin.permissions.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {say('screens.pluginsPanel.installReviewDialog.nothingBeyondDrawingItsOwnPages')}
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border/50 rounded-xl border border-border/60">
                  {preview.plugin.permissions.map((permission) => {
                    const said = describePermission(permission);

                    return (
                      <li key={permission.kind} className="flex flex-col gap-0.5 px-3 py-2.5">
                        <span className="text-sm font-medium text-text">{said.title}</span>
                        <span className="text-xs leading-relaxed text-text-muted">
                          {said.detail}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {preview.plugin.downloadClients.length === 0 &&
            preview.plugin.sources.length === 0 ? null : (
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-text-muted">
                  {say('screens.pluginsPanel.installReviewDialog.itAdds')}
                </h3>

                <ul className="flex flex-col divide-y divide-border/50 rounded-xl border border-border/60">
                  {preview.plugin.downloadClients.map((client) => (
                    <li key={`client:${client.id}`} className="flex flex-col gap-0.5 px-3 py-2.5">
                      <span className="text-sm font-medium text-text">{client.title}</span>
                      <span className="text-xs leading-relaxed text-text-muted">
                        {say(
                          'screens.pluginsPanel.installReviewDialog.aDownloadClientThatDownloadsOn',
                        )}
                      </span>
                    </li>
                  ))}

                  {preview.plugin.sources.map((source) => (
                    <li key={`source:${source.id}`} className="flex flex-col gap-0.5 px-3 py-2.5">
                      <span className="text-sm font-medium text-text">{source.title}</span>
                      <span className="text-xs leading-relaxed text-text-muted">
                        {say(
                          'screens.pluginsPanel.installReviewDialog.aSourceThatPlaysFilmsStraight',
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {isUnsigned ? (
              <Checkbox
                label={say('screens.pluginsPanel.installReviewDialog.iUnderstandThisPluginIsNot')}
                checked={isUnderstood}
                onCheckedChange={setIsUnderstood}
              />
            ) : null}
          </DialogContent>

          <DialogFooter
            dismiss={{ onChoose: onClose }}
            confirm={{
              label: isUnsigned
                ? say('screens.pluginsPanel.installReviewDialog.installAnyway')
                : say('common.install'),
              isDestructive: isUnsigned,
              isLoading: isInstalling,
              isDisabled: isUnsigned && !isUnderstood,
              onChoose: () => {
                setIsInstalling(true);

                void installPlugin({
                  token: preview.token,
                  acceptedPermissionsHash: preview.permissionsHash,
                  acceptUnsigned: isUnsigned && isUnderstood,
                })
                  .then(() => {
                    tellOutcome(
                      say('screens.pluginsPanel.installReviewDialog.installedName', {
                        name: preview.plugin.name,
                      }),
                      null,
                    );
                    onInstalled();
                  })
                  .catch((problem: Error) => {
                    tellOutcome('', problem.message);
                  })
                  .finally(() => {
                    setIsInstalling(false);
                  });
              },
            }}
          />
        </>
      )}
    </Dialog>
  );
};

InstallReviewDialog.displayName = 'InstallReviewDialog';

export { InstallReviewDialog };
