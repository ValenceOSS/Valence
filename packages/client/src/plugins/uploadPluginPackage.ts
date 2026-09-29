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
  const headers: Record<string, string> = { 'content-type': 'application/gzip' };

  if (signature !== null) {
    headers['x-valence-signature'] = (await signature.text()).trim();
  }

  const response = await fetch('/api/plugins/upload', {
    method: 'POST',
    credentials: 'same-origin',
    headers,
    body: file,
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const said = ErrorSchema.safeParse(body);

    throw new Error(said.success ? said.data.error : 'That file could not be read as a plugin.');
  }

  return InstallPreviewSchema.parse(body);
};

export { uploadPluginPackage };
