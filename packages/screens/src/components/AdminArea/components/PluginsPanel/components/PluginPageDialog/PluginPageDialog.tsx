import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { PluginSurfaceView } from '@ValenceScreens/components/PluginSurfaceView/PluginSurfaceView';
import type { PluginPageDialogProps } from './PluginPageDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * A page a plugin adds for administrators, raised over the plugins list.
 *
 * @param page - Which page, or nothing while the dialog is shut.
 * @param onClose - Told it was dismissed.
 */
const PluginPageDialog = ({ page, onClose }: PluginPageDialogProps) => (
  <Dialog
    label={page?.title ?? say('screens.pluginsPanel.pluginPageDialog.pluginPage')}
    isOpen={page !== null}
    onClose={onClose}
  >
    {page === null ? null : (
      <>
        <DialogTitle title={page.title} />

        <DialogContent>
          <PluginSurfaceView
            place={{ kind: 'page', pluginId: page.pluginId, pageId: page.pageId }}
          />
        </DialogContent>

        <DialogFooter dismiss={{ label: say('common.done'), onChoose: onClose }} />
      </>
    )}
  </Dialog>
);

PluginPageDialog.displayName = 'PluginPageDialog';

export { PluginPageDialog };
