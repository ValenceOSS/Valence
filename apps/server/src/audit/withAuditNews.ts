import type { AuditService } from './AuditService';

/**
 * Wraps the audit log so every entry it records is told to whoever is watching it, and an open audit
 * page reads it again without waiting.
 *
 * @param audit - The audit log.
 * @param tell - Says the log changed.
 * @returns The same log, telling of each entry.
 */
const withAuditNews = (audit: AuditService, tell: () => void): AuditService => ({
  ...audit,
  record: async (entry, recording) => {
    await audit.record(entry, recording);
    tell();
  },
});

export { withAuditNews };
