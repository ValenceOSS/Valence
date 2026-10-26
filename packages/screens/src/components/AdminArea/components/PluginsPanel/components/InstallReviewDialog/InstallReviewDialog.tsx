import { useEffect, useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { installPlugin } from '@ValenceClient/plugins/installPlugin';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { InstallReview } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/InstallReviewDialog/components/InstallReview/InstallReview';
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

  return (
    <Dialog
      label={say('screens.pluginsPanel.installReviewDialog.installAPlugin')}
      isOpen={preview !== null}
      onClose={onClose}
    >
      {preview === null ? null : (
        <InstallReview
          preview={preview}
          isUnderstood={isUnderstood}
          onUnderstood={setIsUnderstood}
          isInstalling={isInstalling}
          onCancel={onClose}
          onInstall={() => {
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
          }}
        />
      )}
    </Dialog>
  );
};

InstallReviewDialog.displayName = 'InstallReviewDialog';

export { InstallReviewDialog };
