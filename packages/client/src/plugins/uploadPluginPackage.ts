import { z } from 'zod';
import { InstallPreviewSchema } from '@ValenceContracts/schemas/Plugin';
import type { InstallPreview } from '@ValenceContracts/schemas/Plugin';

const ErrorSchema = z.object({ error: z.string() });

/**
 * Sends a `.vplugin` somebody chose, and a signature for it where they have one, for the server to
 * open and check before anything is installed.
 *
 * @param file - The package.
 * @param signature - Its signature file, where there is one.
 * @returns What it would install, and what the server warns about it.
 * @throws With the server's words where it refused the file.
 */
const uploadPluginPackage = async (file: Blob, signature: Blob | null): Promise<InstallPreview> => {
  const form = new FormData();

  form.append('package', file);

  if (signature !== null) {
    form.append('signature', signature);
  }

  const response = await fetch('/api/plugins/upload', {
    method: 'POST',
    credentials: 'same-origin',
    body: form,
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const said = ErrorSchema.safeParse(body);

    throw new Error(said.success ? said.data.error : 'That file could not be read as a plugin.');
  }

  return InstallPreviewSchema.parse(body);
};

export { uploadPluginPackage };
