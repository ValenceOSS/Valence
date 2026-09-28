import { useEffect, useState } from 'react';
import {
  ShieldCheck as ShieldCheckIcon,
  TriangleAlert as TriangleAlertIcon,
} from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
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
import type { InstallReviewDialogProps } from './InstallReviewDialog.types';

/**
 * The last look before a plugin is installed: who made it, whether Valence can vouch for it, and
 * everything it would be allowed to do, in plain words. A plugin that is not signed by Valence says
 * so at the top, and cannot be installed until somebody has said they understand what that means.
 * The permissions shown are the permissions agreed: the fingerprint the server gave for them goes
 * back with the install, so a package whose permissions changed since it was read is refused.
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

  return (
    <Dialog label="Install a plugin" isOpen={preview !== null} onClose={onClose}>
      {preview === null ? null : (
        <>
          <DialogTitle
            title={`Install ${preview.plugin.name}?`}
            detail={`Version ${preview.plugin.version} by ${preview.plugin.author}`}
            icon={
              <Icon
                of={isUnsigned ? TriangleAlertIcon : ShieldCheckIcon}
                size={18}
                className={isUnsigned ? 'text-danger' : 'text-success'}
              />
            }
          >
            <Badge size="sm" tone={isUnsigned ? 'danger' : 'success'}>
              {isUnsigned ? 'Not signed' : 'Official'}
            </Badge>
          </DialogTitle>

          <DialogContent className="flex flex-col gap-5">
            {isUnsigned ? (
              <Callout
                title="Valence cannot vouch for this plugin"
                tone="danger"
                icon={TriangleAlertIcon}
              >
                It is not signed by the Valence catalogue, so nobody has checked who made it or that
                it is what it says. It still runs in Valence’s sandbox with only the permissions
                below, but only install it if you trust where it came from.
              </Callout>
            ) : null}

            {preview.warnings.map((warning) => (
              <Callout key={warning} title={warning} tone="warning" />
            ))}

            {preview.replacesVersion === null ? null : (
              <p className="text-sm text-text-muted">
                This replaces version {preview.replacesVersion}, keeping its settings and what it
                stored.
              </p>
            )}

            <p className="text-sm leading-relaxed text-text">{preview.plugin.description}</p>

            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-text-muted">
                It will be allowed to
              </h3>

              {preview.plugin.permissions.length === 0 ? (
                <p className="text-sm text-text-muted">
                  Nothing beyond drawing its own pages. It cannot reach your library, your people or
                  the internet.
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

            {isUnsigned ? (
              <Checkbox
                label="I understand this plugin is not signed, and I trust where it came from"
                checked={isUnderstood}
                onCheckedChange={setIsUnderstood}
              />
            ) : null}
          </DialogContent>

          <DialogFooter
            dismiss={{ onChoose: onClose }}
            confirm={{
              label: isUnsigned ? 'Install anyway' : 'Install',
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
                    tellOutcome(`Installed ${preview.plugin.name}.`, null);
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
