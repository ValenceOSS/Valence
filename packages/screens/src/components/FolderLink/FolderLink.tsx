import { FolderOpen as FolderOpenIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { FolderLinkProps } from './FolderLink.types';

/**
 * A path on the server's disk, written small beneath whatever it belongs to, that opens its folder
 * in the file manager when pressed.
 *
 * @param shown - The path as it is written.
 * @param folder - The folder it opens.
 * @param onOpen - Called with the folder to open.
 */
const FolderLink = ({ shown, folder, onOpen }: FolderLinkProps) => (
  <Button
    variant="subtle"
    size="none"
    className="min-w-0 max-w-full justify-start gap-1 text-xs underline-offset-4 hover:underline"
    label={`Open ${folder} in Files`}
    onClick={() => {
      onOpen(folder);
    }}
  >
    <Icon of={FolderOpenIcon} size={12} />
    <span className="truncate">{shown}</span>
  </Button>
);

FolderLink.displayName = 'FolderLink';

export { FolderLink };
