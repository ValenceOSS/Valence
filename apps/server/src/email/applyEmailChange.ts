import type { EmailSettings } from '@ValenceContracts/schemas/EmailSettings';
import type { EmailSetupChange } from '@ValenceContracts/schemas/EmailSetup';

/**
 * The email settings once an administrator's change is saved, keeping the stored password when the
 * change leaves it empty, since a browser is never sent it to send back, and dropping it with the
 * username.
 *
 * @param current - The settings saved now.
 * @param change - What the administrator saved.
 * @returns The settings to store.
 */
const applyEmailChange = (current: EmailSettings, change: EmailSetupChange): EmailSettings => ({
  isEnabled: change.isEnabled,
  host: change.host.trim(),
  port: change.port,
  security: change.security,
  username: change.username,
  password:
    change.username === ''
      ? ''
      : change.password === undefined || change.password === ''
        ? current.password
        : change.password,
  fromName: change.fromName.trim(),
  fromAddress: change.fromAddress.trim(),
  sendsPasswordResets: change.sendsPasswordResets,
  sendsSetupLinks: change.sendsSetupLinks,
});

export { applyEmailChange };
