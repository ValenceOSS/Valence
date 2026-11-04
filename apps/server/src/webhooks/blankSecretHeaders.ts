import type { CustomWebhook } from '@ValenceContracts/schemas/Webhook';

/**
 * Hides the value of every header marked secret, so a Custom webhook's setup can be shown without
 * handing out the tokens it sends.
 *
 * @param custom - The setup as stored, or nothing for a webhook that is not Custom.
 * @returns The same setup with each secret header's value emptied.
 */
const blankSecretHeaders = (custom: CustomWebhook | null): CustomWebhook | null =>
  custom === null
    ? null
    : {
        ...custom,
        headers: custom.headers.map((header) =>
          header.isSecret ? { ...header, value: '' } : header,
        ),
      };

export { blankSecretHeaders };
