import { changeOnServer } from '@ValenceClient/query/changeOnServer';

/**
 * Installs a plugin the server has already fetched and checked, with the permissions somebody was
 * shown. The fingerprint the server gave for those permissions travels back with it, so a plugin
 * whose permissions changed since they were read is refused rather than installed with more than was
 * agreed.
 *
 * @param install - The preview's token, the fingerprint of the permissions that were shown, and
 *   whether somebody accepted that it is not signed.
 * @throws With the server's words where it refused.
 */
const installPlugin = async (install: {
  token: string;
  acceptedPermissionsHash: string;
  acceptUnsigned: boolean;
}): Promise<void> => {
  await changeOnServer(
    '/api/plugins/install',
    { method: 'POST', json: install },
    'That plugin could not be installed.',
  );
};

export { installPlugin };
