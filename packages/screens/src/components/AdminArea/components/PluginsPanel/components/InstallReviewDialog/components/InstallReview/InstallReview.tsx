import {
  ShieldCheck as ShieldCheckIcon,
  TriangleAlert as TriangleAlertIcon,
} from '@keyline-icons/react/fill';
import { Callout } from '@ValenceUI/Callout';
import { Checkbox } from '@ValenceUI/Checkbox';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { PluginPermissionList } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/InstallReviewDialog/components/PluginPermissionList/PluginPermissionList';
import { TrustBadge } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/TrustBadge/TrustBadge';
import { say } from '@ValenceI18n/say';
import type { InstallReviewProps } from './InstallReview.types';

/**
 * The last look before a plugin is installed: who made it, who vouches for it, what it may do, and
 * the buttons that install it or think again.
 *
 * @param preview - What the server fetched and checked.
 * @param isUnderstood - Whether somebody has accepted that an unsigned plugin is unchecked.
 * @param onUnderstood - Told when that is ticked or unticked.
 * @param isInstalling - Whether it is being installed now.
 * @param onCancel - Told to think again.
 * @param onInstall - Told to install it.
 */
const InstallReview = ({
  preview,
  isUnderstood,
  onUnderstood,
  isInstalling,
  onCancel,
  onInstall,
}: InstallReviewProps) => {
  const isUnsigned = preview.trust === 'unsigned';
  const isTrusted = preview.trust === 'trusted';

  return (
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
            title={say('screens.pluginsPanel.installReviewDialog.valenceCannotVouchForThisPlugin')}
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

        <PluginPermissionList permissions={preview.plugin.permissions} />

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
                    {say('screens.pluginsPanel.installReviewDialog.aDownloadClientThatDownloadsOn')}
                  </span>
                </li>
              ))}

              {preview.plugin.sources.map((source) => (
                <li key={`source:${source.id}`} className="flex flex-col gap-0.5 px-3 py-2.5">
                  <span className="text-sm font-medium text-text">{source.title}</span>
                  <span className="text-xs leading-relaxed text-text-muted">
                    {say('screens.pluginsPanel.installReviewDialog.aSourceThatPlaysFilmsStraight')}
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
            onCheckedChange={onUnderstood}
          />
        ) : null}
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onCancel }}
        confirm={{
          label: isUnsigned
            ? say('screens.pluginsPanel.installReviewDialog.installAnyway')
            : say('common.install'),
          isDestructive: isUnsigned,
          isLoading: isInstalling,
          isDisabled: isUnsigned && !isUnderstood,
          onChoose: onInstall,
        }}
      />
    </>
  );
};

InstallReview.displayName = 'InstallReview';

export { InstallReview };
