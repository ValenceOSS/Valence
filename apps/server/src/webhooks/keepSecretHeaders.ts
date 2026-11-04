import type { CustomWebhook } from '@ValenceContracts/schemas/Webhook';

/**
 * Keeps the stored value of every hidden header that comes back empty, since it was emptied to be
 * shown rather than cleared by whoever saved the setup — found by its name, or where it was renamed
 * or unhidden, by its place in the list.
 *
 * @param next - The setup as saved.
 * @param stored - The setup held until now, or nothing where there was none.
 * @returns The setup to store.
 */
const keepSecretHeaders = (next: CustomWebhook, stored: CustomWebhook | null): CustomWebhook => ({
  ...next,
  headers: next.headers.map((header, at) => {
    if (header.value !== '') {
      return header;
    }

    const there = stored?.headers[at];
    const kept =
      stored?.headers.find(
        (one) => one.isSecret && one.name.toLowerCase() === header.name.toLowerCase(),
      ) ?? (there?.isSecret === true ? there : undefined);

    return kept === undefined ? header : { ...header, value: kept.value };
  }),
});

export { keepSecretHeaders };
